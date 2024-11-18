import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, collection } from 'firebase/firestore';
import { db } from './../firebaseConfig';
import { fetchUserFromWebStorage } from './../repository/webstorage/user';
import { setActiveUser } from '../repository/firestore/activeUser';
import {
  handleBeforeUnload,
  handleCountdown,
  fetchChatMessages,
  submitMsg,
  startModalTimer,
  clearModalTimer,
  saveEnterTheRoomAnnounceMessage,
} from '../service/model/chatPageService';
import { ChatLog } from './../constants/types/chatLog';
import { CONFESSION_MESSAGE, CONFESSION_REPLY_MESSAGE } from '../constants/common';
import NameIcon from './../components/NameIcon';
import Modal from './../components/Modal';
import './../css/ChatPage.css';
import './../css/Modal.css';


const ChatPage: React.FC = () => {
  const [chatLogs, setChatLogs]                           = useState<ChatLog[]>([]);
  const [inputMsg, setInputMsg]                           = useState('');
  const [countdown, setCountdown]                         = useState(10);
  const isInitialMount                                    = useRef(true);
  const hasRun                                            = useRef(false);
  const [isConfessionModalOpen, setIsConfessionModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen]           = useState(false);
  const modalTimer     = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const user        = useMemo(() => fetchUserFromWebStorage(), []);
  const { room }    = useParams<{ room: string }>();
  const roomRef     = collection(db, 'chatroom', room, 'activeUsers');
  const userRef     = doc(roomRef, user.name); 
  const messagesRef = useMemo(() => collection(db, 'chatroom', room, 'messages'),[room]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const activeUser = async () => {await setActiveUser(userRef, user);};
    activeUser();
    const saveEnter = async () => {await saveEnterTheRoomAnnounceMessage(messagesRef, room, user.name);};
    saveEnter();
    const unloadListener = handleBeforeUnload(userRef);
    window.addEventListener("beforeunload", unloadListener);
    startModalTimer(setIsConfessionModalOpen, modalTimer);
    return () => {
      clearModalTimer(modalTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cleanup = handleCountdown(isConfessionModalOpen, countdownTimer, setCountdown);
    return cleanup;
  }, [isConfessionModalOpen]);

  useEffect(() => {
    if (countdown === 0) closeWithoutSending();
  }, [countdown]);

  useEffect(() => {
    const unsubscribe = fetchChatMessages(
      messagesRef,
      setChatLogs,
      setIsReplyModalOpen,
      user.name,
      isInitialMount
    );
    return () => unsubscribe();
  }, [messagesRef, user.name]);

  const handleSend = async (inputMessage: string, substituteMessage?:string, announceFlag:boolean  = false) => {
    const modalOpenFlag = inputMsg !== CONFESSION_MESSAGE;
    await submitMsg(messagesRef, userRef, user.name, modalOpenFlag, () => setInputMsg(""), inputMessage, substituteMessage, announceFlag);
  };

  const handleCloseConfessionModal = () => {
    setIsConfessionModalOpen(false);
    handleSend("", CONFESSION_MESSAGE);
    setCountdown(10);
  };

  const handleReplySend = () => {
    setIsReplyModalOpen(false);
    handleSend("", CONFESSION_REPLY_MESSAGE);
  };

  const closeWithoutSending = () => {
    setIsConfessionModalOpen(false);
    setCountdown(10);
  };

  return (
    <>
      <div className="chatroom-container">
        <div className="chatroom-logs-container">
        {chatLogs.map((item) =>
          !item.announceFlag ? (
            <div
              className={`balloon_${user.name === item.name ? 'r' : 'l'}`}
              key={item.key}
            >
              <div className="faceicon">
                <NameIcon
                  userName={item.name}
                  option={{ foreColor: user.name === item.name ? '#69C' : '#969' }}
                />
              </div>
              <div style={{ marginLeft: '3px' }}>
                <p className="says">{item.msg}</p>
              </div>
            </div>
          ) : user.name !== item.name ?(
            <div key={item.key}>test</div>
          ): null
        )}
        </div>

        <div className="chatbox">
          <form
            className="chatform"
            onSubmit={async (e) => {
              e.preventDefault();
              await handleSend(inputMsg);
            }}
          >
            <div>{user.name}</div>
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
            />
            <input
              type="image"
              onClick={() => submitMsg}
              src="../img/airplane.png"
              alt="Send Button"
            />
          </form>
        </div>

        <Modal show={isConfessionModalOpen} handleClose={handleCloseConfessionModal} title="運命の出会い" message="同じ部屋にいる相手は運命の人かもしれません。" subMessage="思いを相手に伝えますか？" countdown={`${countdown}秒後にモーダルは自動的に閉じます。`}>
          <input className="modal-input" type="text" value={CONFESSION_MESSAGE} readOnly />
          <button className="modal-submit-button" onClick={handleCloseConfessionModal}>送信</button>
        </Modal>

        <Modal show={isReplyModalOpen} handleClose={() => setIsReplyModalOpen(false)} title="愛の告白" message="相手から愛の告白がありました" subMessage="あなたも思いを伝えますか？" countdown=''>
          <input type="text" value={CONFESSION_REPLY_MESSAGE} readOnly className="modal-input" />
          <button onClick={handleReplySend} className="modal-submit-button">送信</button>
        </Modal>
      </div>
    </>
  );
};

export default ChatPage;
