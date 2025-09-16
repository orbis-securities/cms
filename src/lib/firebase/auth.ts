import { auth } from './config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * 이메일/패스워드로 로그인
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  try {
    console.log('🔐 로그인 시도:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ 로그인 성공:', user.email);
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    const authError = error as AuthError;

    // 에러 메시지 한국어로 변환
    let message = '로그인에 실패했습니다.';
    switch (authError.code) {
      case 'auth/user-not-found':
        message = '존재하지 않는 이메일입니다.';
        break;
      case 'auth/wrong-password':
        message = '비밀번호가 올바르지 않습니다.';
        break;
      case 'auth/invalid-email':
        message = '이메일 형식이 올바르지 않습니다.';
        break;
      case 'auth/too-many-requests':
        message = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
        break;
    }

    throw new Error(message);
  }
}

/**
 * 로그아웃
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('✅ 로그아웃 완료');
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
    throw error;
  }
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
    } else {
      callback(null);
    }
  });
}

/**
 * 현재 사용자 정보 가져오기
 */
export function getCurrentUser(): AuthUser | null {
  const user = auth.currentUser;
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  }
  return null;
}