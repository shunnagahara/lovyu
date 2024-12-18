import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, collection } from 'firebase/firestore';
import { db } from './../firebaseConfig';
import { setActiveUser } from '../repository/firestore/activeUser';
import {
  handleRemoveActiveUser,
  fetchChatMessages,
  submitMsg,
  saveAnnounceMessageForEntering,
} from '../service/model/chatRoomService';
import { useAppSelector } from '../hooks/redux';
import { selectProfile } from '../store/slices/profileSlice';
import { useConfessionModal } from '../hooks/useConfessionModal';
import { useReplyModal } from '../hooks/useReplyModal';
import { ChatLog } from './../constants/types/chatLog';
import { CONFESSION_MESSAGE, CONFESSION_REPLY_MESSAGE } from '../constants/common';
import Modal from './../components/Modal';
import Balloon from './../components/Balloon';
import Announcement from './../components/Announcement';
import ChatInputBox from './../components/ChatInputBox';
import './../css/chatRoom.css';
import './../css/modal.css';


const ChatRoom: React.FC = () => {
  const [chatLogs, setChatLogs]                           = useState<ChatLog[]>([]);
  const [inputMsg, setInputMsg]                           = useState('');
  const isInitialMount                                    = useRef(true);
  const hasRun                                            = useRef(false);
  const profile                                           = useAppSelector(selectProfile);
  const { room }    = useParams<{ room: string }>();
  const roomRef     = collection(db, 'chatroom', room, 'activeUsers');
  const userRef     = doc(roomRef, profile.name); 
  const messagesRef = useMemo(() => collection(db, 'chatroom', room, 'messages'),[room]);

  const handleSend = async (inputMessage: string, substituteMessage?:string, announceFlag:boolean  = false) => {
    const modalOpenFlag = inputMsg !== CONFESSION_MESSAGE;
    await submitMsg(messagesRef, userRef, profile.name, modalOpenFlag, () => setInputMsg(""), inputMessage, substituteMessage, announceFlag);
  };

  const handleConfessionSend = () => {
    handleSend("", CONFESSION_MESSAGE);
  };

  const {
    isModalOpen: isConfessionModalOpen,
    countdown,
    handleClose: handleCloseConfessionModal,
    handleSend: handleConfessionModalSend
  } = useConfessionModal({ 
    room,
    onConfessionSend: handleConfessionSend
  });

  const {
    isReplyModalOpen,
    setIsReplyModalOpen,
    handleReplySend
  } = useReplyModal({
    onReplySend: handleSend
  });

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const execActiveUser = async () => {await setActiveUser(userRef, profile);};
    execActiveUser();
    const execSaveAnnounceMessageForEntering = async () => {await saveAnnounceMessageForEntering(messagesRef, room, profile.name);};
    execSaveAnnounceMessageForEntering();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleRemoveUserListener = handleRemoveActiveUser(userRef);
    window.addEventListener("popstate", handleRemoveUserListener);
    window.addEventListener("beforeunload", handleRemoveUserListener);
    return () => {
      window.addEventListener("popstate", handleRemoveUserListener);
      window.addEventListener("beforeunload", handleRemoveUserListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = fetchChatMessages(
      messagesRef,
      setChatLogs,
      setIsReplyModalOpen,
      profile.name,
      isInitialMount
    );
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesRef]);

  return (
    <>
      <div className="chatroom-container">
        <div className="chatroom-logs-container">
        {chatLogs.map((item) =>
          !item.announceFlag ? (
            <Balloon
              key={item.key}
              userName={item.name}
              message={item.msg}
              isCurrentUser={profile.name === item.name}
            />
          ) : profile.name !== item.name ?(
            <Announcement key={item.key} message={item.msg} />
          ): null
        )}
        </div>

        <ChatInputBox userName={profile.name} onSendMessage={handleSend} />

        <Modal show={isConfessionModalOpen} handleClose={handleCloseConfessionModal} title="運命の出会い" message="同じ部屋にいる相手は運命の人かもしれません。" subMessage="思いを相手に伝えますか？" countdown={`${countdown}秒後にモーダルは自動的に閉じます。`}>
          <input className="modal-input" type="text" value={CONFESSION_MESSAGE} readOnly />
          <button className="modal-submit-button" onClick={handleConfessionModalSend}>送信</button>
        </Modal>

        <Modal show={isReplyModalOpen} handleClose={() => setIsReplyModalOpen(false)} title="愛の告白" message="相手から愛の告白がありました" subMessage="あなたも思いを伝えますか？" countdown=''>
          <input type="text" value={CONFESSION_REPLY_MESSAGE} readOnly className="modal-input" />
          <button onClick={handleReplySend} className="modal-submit-button">送信</button>
        </Modal>
      </div>
    </>
  );
};

export default ChatRoom;
