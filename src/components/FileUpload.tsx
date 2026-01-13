import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2, FileText, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  conversationId: string;
  onFileUploaded?: (file: any) => void;
}

export const FileUpload = ({ conversationId, onFileUploaded }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!conversationId) {
      toast.error("You need an active conversation before uploading files.");
      event.target.value = '';
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Process document to extract text
      await supabase.functions.invoke('process-document', {
        body: { documentId: document.id }
      });

      toast.success('File uploaded successfully');
      onFileUploaded?.(document);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('text')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.md"
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-muted"
          disabled={isUploading}
          asChild
        >
          <span>
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </span>
        </Button>
      </label>
    </>
  );
};