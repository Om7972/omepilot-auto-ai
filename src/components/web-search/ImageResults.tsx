import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { ImageResult } from "./types";

interface Props {
  images: ImageResult[];
}

const ImageFallback = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 p-4 h-full text-muted-foreground">
    <div className="p-3 rounded-full bg-muted">
      <ImageIcon className="h-5 w-5" />
    </div>
    <span className="text-xs text-center line-clamp-2">{title}</span>
  </div>
);

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
            <ImageTile key={i} img={img} index={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ImageTile = ({ img, index }: { img: ImageResult; index: number }) => {
  const [failed, setFailed] = useState(false);

  return (
    <motion.a
      href={img.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      className="group relative rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all aspect-video bg-muted"
    >
      {failed ? (
        <ImageFallback title={img.title} />
      ) : (
        <img
          src={img.url}
          alt={img.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate flex items-center gap-1">
          {img.title}
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </p>
      </div>
    </motion.a>
  );
};
