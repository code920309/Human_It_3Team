import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  where,
  limit,
  getDocFromServer
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, HealthReport } from "./types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 연결 테스트
export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase 설정을 확인해주세요. 클라이언트가 오프라인입니다.");
    }
  }
};

export const saveUserToFirestore = async (user: User) => {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, path), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserFromFirestore = async (uid: string): Promise<User | null> => {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, path));
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const saveReportToFirestore = async (uid: string, report: HealthReport) => {
  const path = `users/${uid}/reports/${report.id}`;
  try {
    await setDoc(doc(db, path), { ...report, userId: uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getReportsFromFirestore = async (uid: string): Promise<HealthReport[]> => {
  const path = `users/${uid}/reports`;
  try {
    const q = query(collection(db, path), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as HealthReport);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteReportFromFirestore = async (uid: string, reportId: string) => {
  const path = `users/${uid}/reports/${reportId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// 기존 storage.ts 함수들을 Firebase 버전으로 래핑하거나 대체하기 위해 남겨둠 (호환성용)
// 실제로는 App.tsx에서 위 함수들을 직접 호출하는 것이 좋음.
export const getUser = (): User | null => {
  // 동기 방식은 더 이상 지원되지 않으므로 null 반환 (App.tsx에서 수정 필요)
  return null;
};

export const saveUser = (user: User) => {
  saveUserToFirestore(user);
};

export const clearUser = () => {
  // 로그아웃은 auth.signOut()으로 처리
};

export const getReports = (): HealthReport[] => {
  return [];
};

export const saveReport = (report: HealthReport) => {
  if (auth.currentUser) {
    saveReportToFirestore(auth.currentUser.uid, report);
  }
};

export const clearReports = () => {
  // 개별 삭제 또는 전체 삭제 로직 필요
};
