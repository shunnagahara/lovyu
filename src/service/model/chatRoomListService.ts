import { User } from './../../constants/types/user';
import { collection, onSnapshot } from "firebase/firestore";
import { RoomInfo } from '../../constants/types/roomInfo';
import { db } from './../../firebaseConfig';

type RoomSubscriptionArgs = {
  storedUser: User;
  setRooms: React.Dispatch<React.SetStateAction<RoomInfo[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export const subscribeToRooms = ({
  storedUser,
  setRooms,
  setIsLoading,
}: RoomSubscriptionArgs) => {
  const roomNames = ["1", "2", "3", "4", "5", "6"];

  const unsubscribers = roomNames.map((roomId) => {
    const activeUsersRef = collection(db, "chatroom", roomId, "activeUsers");

    return onSnapshot(activeUsersRef, async (snapshot) => {
      // 各ユーザーのドキュメントIDを取得し、詳細情報を取得する
      const users = await Promise.all(
        snapshot.docs.map(async (userDoc) => {
          return userDoc.data() as User;
        })
      );

      setRooms((prevRooms) => {
        const userCount = snapshot.size;
        const matchingRate =
          userCount === 1 && users[0]
            ? calculateMatchingRate(users[0], storedUser)
            : undefined;

        const newRoomData = {
          id: roomId,
          userCount,
          matchingRate,
          users,
        };
        return [...prevRooms.filter((r) => r.id !== roomId), newRoomData];
      });

      setIsLoading(false);
    });
  });

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
};

export const calculateMatchingRate = (user: User, storedUser: User): number => {
  let matchCount = 0;
  let totalAttributes = 0;

  if (user.appearance === storedUser.favoriteAppearance) matchCount++;
  totalAttributes++;

  if (user.ageRange === storedUser.favoriteAgeRange) matchCount++;
  totalAttributes++;

  // `selectedPersonalities`オブジェクトの比較
  for (const key in user.personalities) {
    if (user.personalities[key] === storedUser.selectedPersonalities[key]) {
      matchCount++;
    }
    totalAttributes++;
  }

  // 一致率をパーセンテージで返す
  return Math.floor((matchCount / totalAttributes) * 100);
};