import { HttpClient } from "./client";

export enum MediaTypeCategory {
  MINUTA = "MINUTA",
  VISITOR = "VISITOR",
  CORRESPONDENCE = "CORRESPONDENCE",
  PARKING = "PARKING",
  EMPLOYEE = "EMPLOYEE",
  CLIENT = "CLIENT",
  INVENTORY = "INVENTORY",
  DOCUMENT = "DOCUMENT",
}

export interface UploadMediaParams {
  file: File;
  entityType: MediaTypeCategory;
  entityId: string;
  clientId?: string | null;
  subType?: string;
  category?: string;
}

export interface MediaAttachmentResponse {
  id: string;
  url: string;
  s3Key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  presignedUrl?: string;
  createdAt: string;
}

export class StorageApi {
  /**
   * Uploads a physical file attached to an entity to AWS S3
   */
  static async uploadMedia(params: UploadMediaParams): Promise<MediaAttachmentResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("entityType", params.entityType);
    formData.append("entityId", params.entityId);

    if (params.clientId) {
      formData.append("clientId", params.clientId);
    }
    if (params.subType) {
      formData.append("subType", params.subType);
    }
    if (params.category) {
      formData.append("category", params.category);
    }

    return HttpClient.upload<MediaAttachmentResponse>("/storage/upload", formData);
  }

  /**
   * Gets a 15-minute Presigned URL for viewing/downloading a media attachment
   */
  static async getPresignedUrl(mediaId: string): Promise<{ presignedUrl: string; fileName: string }> {
    return HttpClient.get<{ presignedUrl: string; fileName: string }>(`/storage/${mediaId}/presigned-url`);
  }

  /**
   * Gets all media attachments for a given entity
   */
  static async getByEntity(
    entityType: MediaTypeCategory,
    entityId: string
  ): Promise<MediaAttachmentResponse[]> {
    return HttpClient.get<MediaAttachmentResponse[]>(`/storage/by-entity/${entityType}/${entityId}`);
  }

  /**
   * Deletes a media attachment physically from S3 and DB
   */
  static async deleteMedia(mediaId: string): Promise<void> {
    return HttpClient.delete<void>(`/storage/${mediaId}`);
  }
}
