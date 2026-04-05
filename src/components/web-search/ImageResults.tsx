import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { ImageResult } from "./types";

interface Props {
  images: ImageResult[];
}

export const ImageResults = ({ images }: Props) => {
  if (!images || images.length === 0) return null;

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Related Images ({images.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <motion.a
              key={i}
              href={img.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all aspect-video bg-muted"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                  const fallback = document.createElement('div');
                  fallback.className = 'flex flex-col items-center gap-1 text-muted-foreground p-2';
                  fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-xs text-center">${img.title.slice(0, 30)}</span>`;
                  (e.target as HTMLImageElement).parentElement!.appendChild(fallback);
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate flex items-center gap-1">
                  {img.title}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
