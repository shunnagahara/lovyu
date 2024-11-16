import { DocumentReference, doc, CollectionReference, onSnapshot, query, orderBy, limit, QuerySnapshot  } from "firebase/firestore";
import { ChatLog } from "../../constants/types/chatLog";
import { deleteActiveUser, updateLastUpdated } from "../../repository/firestore/activeUser";
import { updateMessageModalFlag, addMessage } from "../../repository/firestore/message";
/**
 * BeforeUnloadイベントでFirestoreのユーザー情報を削除する
 * @param userRef Firestoreのユーザードキュメント参照
 * @returns イベントリスナーの関数
 */
export const handleBeforeUnload = (userRef: DocumentReference) => {
  return (event: BeforeUnloadEvent) => {
    deleteActiveUser(userRef).catch((error) => {
      console.error("Error occurred during beforeunload:", error);
    });
    event.preventDefault();
  };
};

/**
 * カウントダウンタイマーのセットアップとクリーンアップ
 * @param isModalOpen モーダルの状態
 * @param countdownTimer タイマーを管理するRef
 * @param setCountdown カウントダウン値を更新する関数
 */
export const handleCountdown = (
  isModalOpen: boolean,
  countdownTimer: React.MutableRefObject<NodeJS.Timeout | null>,
  setCountdown: React.Dispatch<React.SetStateAction<number>>
) => {
  if (isModalOpen) {
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
  } else {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
  }

  return () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
  };
};

/**
 * モーダルを開き、`modalOpenFlag`を更新する関数
 * @param messagesRef Firestoreのメッセージコレクション参照
 * @param messageId 更新するメッセージのID
 * @param setIsLoveConfessionModalOpen モーダルの状態を更新する関数
 */
export const handleOpenModal = async (
  messagesRef: CollectionReference,
  messageId: string,
  setIsLoveConfessionModalOpen: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  try {
    // モーダルを開く
    setIsLoveConfessionModalOpen(true);

    const messageDoc = doc(messagesRef, messageId);
    await updateMessageModalFlag(messageDoc, true);

  } catch (error) {
    console.error("Failed to open modal and update modalOpenFlag:", error);
  }
};

/**
 * チャットメッセージを取得し、更新処理を行う
 * @param messagesRef Firestoreのメッセージコレクション参照
 * @param setChatLogs チャットログの更新関数
 * @param setIsLoveConfessionModalOpen モーダルの状態を更新する関数
 * @param userName 現在のユーザー名
 * @param isInitialMount 初回マウントのフラグ
 */
export const fetchChatMessages = (
  messagesRef: CollectionReference,
  setChatLogs: React.Dispatch<React.SetStateAction<ChatLog[]>>,
  setIsReplyModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  userName: string,
  isInitialMount: React.MutableRefObject<boolean>
) => {
  const q = query(messagesRef, orderBy("date", "desc"), limit(10));

  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        if (isInitialMount.current) return;

        const data = change.doc.data() as ChatLog;
        if (isLoveConfessionMessage(data, userName)) {
          // モーダルを開く処理を呼び出し
          handleOpenModal(messagesRef, change.doc.id, setIsReplyModalOpen);
        }

        // 初回以降にリアルタイムで追加されるメッセージのみを表示
        const log = {
          key: change.doc.id,
          ...data,
        } as ChatLog;

        setChatLogs((prevLogs) => [...prevLogs, log]);
      }
    });
    isInitialMount.current = false;
  });
};

/**
 * メッセージ送信処理
 * @param messagesRef Firestoreのメッセージコレクション参照
 * @param userRef Firestoreのユーザードキュメント参照
 * @param userName 送信者の名前
 * @param message メッセージ内容
 * @param modalOpenFlag モーダルオープンフラグ
 * @param resetInput 入力欄リセット用関数
 */
export const submitMsg = async (
  messagesRef: CollectionReference,
  userRef: DocumentReference,
  userName: string,
  modalOpenFlag: boolean,
  resetInput: () => void,
  message?: string,
  substituteMessage?: string
): Promise<void> => {

  const properMessage = (message)? message : substituteMessage

  await addMessage(messagesRef, {
    name: userName,
    msg: properMessage,
    date: new Date().getTime(),
    modalOpenFlag,
  });

  // ユーザーの`lastUpdated`フィールドを更新
  await updateLastUpdated(userRef)

  // 入力欄をリセット
  resetInput();
};

/**
 * メッセージが特定条件を満たすかどうかを判定する
 * @param messageData メッセージのデータ
 * @param currentUserName 現在のユーザー名
 * @returns 条件を満たす場合は`true`、それ以外は`false`
 */
export const isLoveConfessionMessage = (
  messageData: ChatLog,
  currentUserName: string
): boolean => {
  return (
    messageData.msg === "愛してます" &&
    messageData.name !== currentUserName &&
    messageData.modalOpenFlag === false
  );
};

/**
 * モーダルを一定時間ごとに開くタイマーを設定
 * @param setIsConfessionModalOpen モーダルを開く状態を更新する関数
 * @param intervalRef タイマーIDを保持するRef
 * @param intervalTime タイマーの間隔（ミリ秒単位、デフォルト: 30000ミリ秒）
 */
export const startModalTimer = (
  setIsConfessionModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  intervalTime: number = 30000
) => {
  intervalRef.current = setInterval(() => {
    setIsConfessionModalOpen(true);
  }, intervalTime);
};

/**
 * モーダルタイマーをクリア
 * @param intervalRef タイマーIDを保持するRef
 */
export const clearModalTimer = (intervalRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
};