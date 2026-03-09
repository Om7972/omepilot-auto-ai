import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface PendingFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  storagePath?: string;
  documentId?: string;
}

interface FileUploadProps {
  conversationId?: string | null;
  onFileUploaded?: (file: any) => void;
  onCreateConversation?: (conversationId: string) => void;
  onFilePending?: (file: PendingFile) => void;
}

export const FileUpload = ({ conversationId, onFileUploaded, onCreateConversation, onFilePending }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a local preview URL for images
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      // Auto-create conversation if none exists
      let activeConversationId = conversationId;
      if (!activeConversationId || activeConversationId.trim() === '') {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, title: `File: ${file.name}` })
          .select()
          .single();
        if (convError) throw new Error('Failed to create conversation: ' + convError.message);
        activeConversationId = newConv.id;
        if (onCreateConversation) onCreateConversation(activeConversationId);
      }

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
          conversation_id: activeConversationId,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
        })
        .select()
        .single();
      if (dbError) throw dbError;

      // Notify parent with pending file info for inline display
      const pendingFile: PendingFile = {
        id: document.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: previewUrl,
        storagePath: fileName,
        documentId: document.id,
      };
      onFilePending?.(pendingFile);

      // Process document
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

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.txt,.doc,.docx,.xlsx,.csv,.jpg,.jpeg,.png,.md"
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-lg hover:bg-accent h-8 w-8"
          disabled={isUploading}
          asChild
        >
          <span>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </span>
        </Button>
      </label>
    </>
  );
};
