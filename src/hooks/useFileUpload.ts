import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadOptions {
  bucket: "avatars" | "attachments" | "documents";
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

interface UploadResult {
  path: string;
  publicUrl: string;
}

interface UseFileUploadReturn {
  uploading: boolean;
  progress: number;
  uploadFile: (file: File, options?: Partial<UploadOptions>) => Promise<UploadResult | null>;
  uploadMultiple: (files: File[], options?: Partial<UploadOptions>) => Promise<UploadResult[]>;
  deleteFile: (bucket: string, path: string) => Promise<boolean>;
  getPublicUrl: (bucket: string, path: string) => string;
}

const DEFAULT_OPTIONS: UploadOptions = {
  bucket: "attachments",
  maxSizeMB: 10,
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
};

export function useFileUpload(): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File, options: UploadOptions): boolean => {
    const maxBytes = (options.maxSizeMB || 10) * 1024 * 1024;

    if (file.size > maxBytes) {
      toast.error(`File size exceeds ${options.maxSizeMB}MB limit`);
      return false;
    }

    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      toast.error(`File type ${file.type} is not allowed`);
      return false;
    }

    return true;
  };

  const generateFilePath = async (file: File, options: UploadOptions): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomId}.${fileExt}`;

    if (options.folder) {
      return `${user.id}/${options.folder}/${fileName}`;
    }
    return `${user.id}/${fileName}`;
  };

  const uploadFile = useCallback(async (
    file: File,
    overrideOptions?: Partial<UploadOptions>
  ): Promise<UploadResult | null> => {
    const options = { ...DEFAULT_OPTIONS, ...overrideOptions };

    if (!validateFile(file, options)) {
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const filePath = await generateFilePath(file, options);

      const { error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload file");
        return null;
      }

      setProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      toast.success("File uploaded successfully");

      return {
        path: filePath,
        publicUrl,
      };
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    overrideOptions?: Partial<UploadOptions>
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      const result = await uploadFile(files[i], overrideOptions);
      if (result) {
        results.push(result);
      }
    }

    setProgress(100);
    return results;
  }, [uploadFile]);

  const deleteFile = useCallback(async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete file");
        return false;
      }

      toast.success("File deleted");
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete file");
      return false;
    }
  }, []);

  const getPublicUrl = useCallback((bucket: string, path: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return publicUrl;
  }, []);

  return {
    uploading,
    progress,
    uploadFile,
    uploadMultiple,
    deleteFile,
    getPublicUrl,
  };
}
