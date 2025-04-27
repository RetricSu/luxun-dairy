import { ComponentChildren } from "preact";
import { useState, useEffect } from "preact/hooks";
import { FriendDiary } from "../types";

interface FriendDiaryReaderProps {
  onViewOriginal?: (entryId: string) => void;
}

export const FriendDiaryReader = ({ 
  onViewOriginal 
}: FriendDiaryReaderProps): ComponentChildren => {
  const [diaries, setDiaries] = useState<FriendDiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

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
		    id: "note1"
		  },
		  {
		    date: "2023-10-28",
		    content: "周末参加了一个有趣的工作坊，认识了很多新朋友。",
		    id: "note2"
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
		    id: "note3"
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
    
    loadMockData();
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
                <div className="mb-4 pb-2 border-b border-[#e5e1d8] dark:border-[#323232]">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#49b3a1] to-[#3a9e8d] flex items-center justify-center text-white">
                      {selectedFriendData.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-lg text-[#5a5955] dark:text-[#d1d1c9]">
                        {selectedFriendData.name}
                      </h3>
                      <span className="text-xs text-[#8c7c67] dark:text-[#a6a69e]">
                        {selectedFriendData.pubkey}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedFriendData.entries.map((entry) => (
                  <div key={entry.id} className="mb-6 pb-6 border-b border-[#e5e1d8] dark:border-[#323232] last:border-b-0">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-md font-medium text-[#49b3a1] dark:text-[#43a595]">
                        {new Date(entry.date).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <button 
                        className="text-xs text-[#8c7c67] dark:text-[#a6a69e] hover:text-[#49b3a1] hover:dark:text-[#43a595]"
                        onClick={() => onViewOriginal && onViewOriginal(entry.id)}
                      >
                        查看 Event
                      </button>
                    </div>
                    <p className="text-[#5a5955] dark:text-[#d1d1c9] whitespace-pre-wrap">
                      {entry.content}
                    </p>
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
