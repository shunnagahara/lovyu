import React, { useState, useEffect } from 'react';
import ChatRoomCard from '../components/ChatRoomCard';
import { subscribeToRooms } from './../service/model/chatRoomListService';
import { isRoomAvailable, fetchRoomImage } from './../service/presentation/chatRoomListService';
import { fetchProfile } from '../repository/webstorage/user';
import { RoomInfo } from './../constants/types/roomInfo';
import { CHAT_PAGE_PATH } from '../constants/common';
import Loading from './../components/Loading';
import './../css/chatRoomList.css';


const ChatRoomList: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rooms, setRooms]         = useState<RoomInfo[]>([]);
  const storedUser                = fetchProfile()

  useEffect(() => {
    const unsubscribe = subscribeToRooms({
      storedUser,
      setRooms,
      setIsLoading,
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <Loading message="ルームを読み込み中..." />;
  }

  return (
    <div className="container">
      {rooms.map((room) => {
        const isAvailable = isRoomAvailable(
          room.userCount,
          storedUser,
          room.user?.gender,
          room.user?.targetGender
        );

        return (
          <ChatRoomCard
            key={room.id}
            title={`Room ${room.id}`}
            description={
              room.userCount > 0
                ? `入室ユーザー数: ${room.userCount}`
                : 'ユーザーなし'
            }
            matchingRate={
              room.userCount > 0
                ? `マッチング率 ${room.matchingRate}%`
                : null
            }
            image={fetchRoomImage(room.userCount)}
            showHeart={room.userCount === 1}
            link={isAvailable ? `${CHAT_PAGE_PATH}/${room.id}` : '#'}
          />
        );
      })}
    </div>
  );
};

export default ChatRoomList;
