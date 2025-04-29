import { ComponentChildren } from "preact";
import { useState, useEffect } from "preact/hooks";
import { FriendDiary } from "../types";
import { shortenKey } from "../utils/helpers";
import { fetchGiftWraps } from "../utils/diaryService";

interface FriendDiaryReaderProps {
  onViewOriginal?: (entryId: string) => void;
}

export const FriendDiaryReader = ({ 
  onViewOriginal 
}: FriendDiaryReaderProps): ComponentChildren => {
  const [diaries, setDiaries] = useState<FriendDiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [giftWraps, setGiftWraps] = useState<string[]>([]);

  useEffect(() => {
    // Simulate loading data from an API
    const loadMockData = async () => {
      setIsLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for friends' shared diaries
      const mockFriendDiaries: FriendDiary[] = [
        {
		name: "张三",
		pubkey: "npub1abc...",
		entries: [
		  {
		    date: "2023-11-02",
		    content: "今天天气很好，出去散步了一会儿。感觉心情好多了。",
		    id: "note1",
            weather: "晴"
		  },
		  {
		    date: "2023-10-28",
		    content: "周末参加了一个有趣的工作坊，认识了很多新朋友。",
		    id: "note2",
            weather: "多云"
		  }
		]
	      },
	      {
		name: "李四",
		pubkey: "npub2def...",
		entries: [
		  {
		    date: "2023-11-03",
		    content: "新书到了，迫不及待地读了前三章。真是太精彩了！",
		    id: "note3",
            weather: "小雨"
		  }
		]
	      }
      ];
      
      // Sort each friend's entries by date in descending order
      const sortedDiaries = mockFriendDiaries.map(friend => ({
        ...friend,
        entries: [...friend.entries].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      }));
      
      setDiaries(sortedDiaries);
      // Set first friend as selected by default if any exist
      if (sortedDiaries.length > 0) {
        setSelectedFriend(sortedDiaries[0].pubkey);
      }
      setIsLoading(false);
    };

    const loadGiftWraps = async () => {
      const giftWraps = await fetchGiftWraps("ws://localhost:8080");
      setGiftWraps(giftWraps);
    };
    
    loadMockData();
    loadGiftWraps();
  }, []);

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
      {/* Debug section for gift wraps */}
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug: Gift Wraps</h3>
        <pre className="text-sm overflow-auto max-h-40">
          {JSON.stringify(giftWraps, null, 2)}
        </pre>
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
                    <div className="flex items-center pb-3 mb-4 border-b border-[#e9e4d9] dark:border-[#2c2c32] text-sm">
                      <span className="text-[#49818b] dark:text-[#49818b] font-medium mr-3">
                        {new Date(entry.date).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-[#718328] dark:text-[#d0e57e] font-medium">
                        {entry.weather}
                      </span>
                      <span className="text-[#9c9b95] dark:text-[#717b7a] text-xs ml-auto flex items-center">
                        <span className="hidden sm:inline">ID: {shortenKey(entry.id)}</span>
                        <button 
                          className="ml-2 bg-[#f7f5f0] dark:bg-[#262630] text-[#6d6a5c] dark:text-[#a2e2d8] text-xs py-0.5 px-2 border border-[#e6e1d5] dark:border-[#323237] rounded-full hover:bg-[#f0ede6] dark:hover:bg-[#2a2a32] transition-colors"
                          onClick={() => onViewOriginal && onViewOriginal(entry.id)}
                        >
                          查看
                        </button>
                      </span>
                    </div>
                    <div className="text-[#2c2c2a] dark:text-[#e9e9e7] leading-7 font-normal">
                      {entry.content.split("\n").map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0">{line}</p>
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
    </div>
  );
}; 
