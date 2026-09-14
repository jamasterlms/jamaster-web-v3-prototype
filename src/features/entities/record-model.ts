export type EntityNote = {
  id: string;
  targetType: 'student' | 'teacher';
  targetId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  targetType: 'student' | 'teacher' | 'staff' | 'user';
  targetId: string;
  actorName: string | null;
  action: string;
  succeededCount: number;
  failedCount: number;
  createdAt: string;
};

export type CommunicationLog = {
  id: string;
  messageId: string;
  studentId: number;
  channel: 'sms' | 'email' | 'whatsapp';
  address: string;
  title: string;
  content: string;
  status: string;
  senderName?: string;
  createdAt: string;
  direction?: 'inbound' | 'outbound';
};

export type SignedDocument = {
  localFile?: import('../students/document-model').LocalDocumentFile;
  id: string;
  studentId: number;
  saleId: string;
  installmentId?: string;
  documentType: 'BONO' | 'TAHHUTNAME' | 'SALE_CONTRACT';
  version: number;
  encryptionStatus: 'PENDING' | 'ENCRYPTED' | 'FAILED';
  signedByStudent: boolean;
  signedByAuthority: boolean;
  signerName: string;
  authorityName?: string;
  signedAt: string;
  createdAt: string;
  courseName: string;
  paidAmount: number;
  paymentType: string;
};

/** Supplied by sales-without-documents, never inferred from an incomplete document page. */
export type SaleWithoutDocument = {
  id: string;
  courseName: string;
  paidAmount: string;
  paymentType: string;
  status: string;
};
