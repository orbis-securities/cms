import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from './config';

export interface Template {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
}

/**
 * 템플릿 저장 (axi 블로그에)
 */
export async function saveTemplateToFirestore(
  title: string,
  content: string,
  blogId: string = 'axi'
): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const templatesRef = collection(db, 'blogs', blogId, 'templates');
    const now = Timestamp.now();

    const templateData = {
      title,
      content,
      createdAt: now,
      updatedAt: now,
      userId: currentUser.uid,
    };

    const docRef = await addDoc(templatesRef, templateData);
    console.log('✅ 템플릿 저장 완료:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ 템플릿 저장 실패:', error);
    throw error;
  }
}

/**
 * 템플릿 목록 가져오기
 */
export async function getTemplatesByBlog(blogId: string = 'axi'): Promise<Template[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const templatesRef = collection(db, 'blogs', blogId, 'templates');
    const q = query(templatesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const templates: Template[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // 현재 사용자의 템플릿만 가져오기
      if (data.userId === currentUser.uid) {
        templates.push({
          id: doc.id,
          ...data,
        } as Template);
      }
    });

    return templates;
  } catch (error) {
    console.error('❌ 템플릿 목록 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 특정 템플릿 가져오기
 */
export async function getTemplateById(
  blogId: string,
  templateId: string
): Promise<Template | null> {
  try {
    const templateRef = doc(db, 'blogs', blogId, 'templates', templateId);
    const templateDoc = await getDoc(templateRef);

    if (templateDoc.exists()) {
      return {
        id: templateDoc.id,
        ...templateDoc.data(),
      } as Template;
    }

    return null;
  } catch (error) {
    console.error('❌ 템플릿 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 템플릿 수정
 */
export async function updateTemplateInFirestore(
  blogId: string,
  templateId: string,
  updates: {
    title?: string;
    content?: string;
  }
): Promise<void> {
  try {
    const templateRef = doc(db, 'blogs', blogId, 'templates', templateId);

    await updateDoc(templateRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ 템플릿 수정 완료:', templateId);
  } catch (error) {
    console.error('❌ 템플릿 수정 실패:', error);
    throw error;
  }
}

/**
 * 템플릿 삭제
 */
export async function deleteTemplateFromFirestore(
  blogId: string,
  templateId: string
): Promise<void> {
  try {
    const templateRef = doc(db, 'blogs', blogId, 'templates', templateId);
    await deleteDoc(templateRef);

    console.log('✅ 템플릿 삭제 완료:', templateId);
  } catch (error) {
    console.error('❌ 템플릿 삭제 실패:', error);
    throw error;
  }
}
