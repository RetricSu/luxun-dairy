import { ComponentChildren } from "preact";
import { useState, useEffect } from "preact/hooks";
import { FriendDiary, toUnwrappedGift } from "../types";
import { shortenKey } from "../utils/helpers";
import { fetchGiftWraps } from "../utils/diaryService";
import { Modal } from "./Modal";
import { NostrEventViewer } from "./NostrEventViewer";

export const FriendDiaryReader = (): ComponentChildren => {
  const [diaries, setDiaries] = useState<FriendDiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNostrEvent, setSelectedNostrEvent] = useState<string | null>(null);
  const [nostrEventData, setNostrEventData] = useState<string | null>(null);

  useEffect(() => {
    const loadGiftWraps = async () => {
      setIsLoading(true);
      try {
        const giftWrapResponses = await fetchGiftWraps();
        const giftWraps = giftWrapResponses.map(toUnwrappedGift);
        // Convert gift wraps to FriendDiary format
        const friendDiariesMap = new Map<string, FriendDiary>();
        
        giftWraps.forEach(gift => {
          const senderPubkey = gift.sender_pubkey;
          const rumor = gift.rumor;
          
          if (!friendDiariesMap.has(senderPubkey)) {
            friendDiariesMap.set(senderPubkey, {
              name: shortenKey(senderPubkey),
              pubkey: senderPubkey,
              entries: []
            });
          }
          
          const friendDiary = friendDiariesMap.get(senderPubkey)!;
          const weatherTag = rumor.tags.find(tag => tag[0] === 'weather');
          friendDiary.entries.push({
            date: new Date(Number(rumor.created_at) * 1000).toISOString().split('T')[0],
            content: rumor.content,
            id: rumor.id,
            weather: weatherTag ? weatherTag[1] : "未知"
          });
        });

        // Convert map to array and sort entries by date
        const friendDiaries = Array.from(friendDiariesMap.values()).map(friend => ({
          ...friend,
          entries: [...friend.entries].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        }));

        setDiaries(friendDiaries);
        if (friendDiaries.length > 0) {
          setSelectedFriend(friendDiaries[0].pubkey);
        }
      } catch (error) {
        console.error("Failed to load gift wraps:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGiftWraps();
  }, []);

  const handleViewOriginal = async (entryId: string) => {
    try {
      setSelectedNostrEvent(entryId);
      // Since we already have the rumor event in the gift wrap, we can use it directly
      const selectedEntry = diaries
        .flatMap(friend => friend.entries)
        .find(entry => entry.id === entryId);
      
      if (selectedEntry) {
        const giftWrapResponses = await fetchGiftWraps();
        const giftWraps = giftWrapResponses.map(toUnwrappedGift);
        const giftWrap = giftWraps.find(gift => gift.rumor.id === entryId);
        
        if (giftWrap) {
          setNostrEventData(JSON.stringify(giftWrap.rumor, null, 2));
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to load Nostr event:", error);
    }
  };

  const closeNostrEventView = () => {
    setIsModalOpen(false);
    setSelectedNostrEvent(null);
    setNostrEventData(null);
  };

  const selectedFriendData = diaries.find(friend => friend.pubkey === selectedFriend);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-center py-8 px-6 text-[#8c7c67] dark:text-[#a6a69e] italic">
          加载中...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-6 bg-[#f9f6f0] dark:bg-[#2a2a28] p-4 rounded-lg">
        <h2 className="text-xl font-medium mb-1 text-[#49818b] dark:text-[#49818b]">
          朋友分享的日记
        </h2>
        <p className="text-sm text-[#8c7c67] dark:text-[#a6a69e]">
          共 {diaries.length} 位朋友分享了日记
        </p>
      </div>
      {diaries.length === 0 ? (
        <div className="text-center py-8 px-6 text-[#8c7c67] dark:text-[#a6a69e] italic">
          暂无朋友分享的日记
        </div>
      ) : (
        <div className="flex gap-4 mt-4">
          {/* Sidebar - with updated styling */}
          <div className="w-1/4 border-r border-[#e5e1d8] dark:border-[#323232] pr-2">
            {diaries.map((friend) => (
              <div 
                key={friend.pubkey} 
                className={`py-2 px-3 mb-1 cursor-pointer flex items-center ${
                  selectedFriend === friend.pubkey 
                    ? 'text-[#49b3a1] dark:text-[#43a595] bg-[#f9f6f0] dark:bg-[#252525] border-l-2 border-[#49b3a1]' 
                    : 'text-[#5a5955] dark:text-[#d1d1c9] hover:bg-[#f9f6f0] dark:hover:bg-[#252525]'
                }`}
                onClick={() => setSelectedFriend(friend.pubkey)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] flex items-center justify-center text-white flex-shrink-0">
                  {friend.name.charAt(0)}
                </div>
                <div className="ml-2 overflow-hidden">
                  <div className="font-medium truncate">{friend.name}</div>
                  <div className="text-xs text-[#8c7c67] dark:text-[#a6a69e] flex justify-between">
                    <span className="truncate">{friend.pubkey}</span>
                    <span className="flex-shrink-0">({friend.entries.length}篇)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Main content area */}
          <div className="w-3/4">
            {selectedFriendData ? (
              <div>
                {selectedFriendData.entries.map((entry) => (
                  <div key={entry.id} className="mb-8 pb-6 bg-white dark:bg-[#1a1a1e] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-[#e9e4d9] dark:border-[#2c2c32] p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center pb-3 mb-4 border-b border-[#e9e4d9] dark:border-[#2c2c32] text-sm gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[#49818b] dark:text-[#49818b] font-medium">
                          {new Date(entry.date).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-[#718328] dark:text-[#d0e57e] font-medium">
                          {entry.weather}
                        </span>
                      </div>
                      <div className="text-[#9c9b95] dark:text-[#717b7a] text-xs sm:ml-auto flex flex-wrap items-center gap-2">
                        <span className="hidden sm:inline break-all">ID: {shortenKey(entry.id)}</span>
                        <button 
                          className="bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] text-xs py-0.5 px-2 border border-[#e6e1d5] dark:border-[#323237] rounded-full hover:bg-[#f0ede6] dark:hover:bg-[#2a2a32] transition-colors whitespace-nowrap"
                          onClick={() => handleViewOriginal(entry.id)}
                        >
                          查看
                        </button>
                      </div>
                    </div>
                    <div className="text-[#2c2c2a] dark:text-[#e9e9e7] leading-7 font-normal">
                      {entry.content.split("\n").map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0 break-words">{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-16">
                <p className="text-center py-8 px-6 text-[#8c7c67] dark:text-[#a6a69e] italic">
                  请选择一个朋友查看日记
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeNostrEventView}>
        {selectedNostrEvent && nostrEventData ? (
          <NostrEventViewer
            selectedNostrEvent={selectedNostrEvent}
            nostrEventData={nostrEventData}
            closeNostrEventView={closeNostrEventView}
            isOwnEvent={false}
          />
        ) : (
          <div className="bg-white dark:bg-[#262624] rounded-md p-8 text-center">
            <p className="text-lg mb-4">无法加载 Nostr 事件数据</p>
            <button 
              onClick={closeNostrEventView} 
              className="bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] dark:from-[#43a595] dark:to-[#389384] text-white py-2 px-5 rounded-full hover:shadow-md"
            >
              关闭
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}; 
