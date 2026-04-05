import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import type { SavedSearch } from "./types";

interface Props {
  saved: SavedSearch[];
}

function generateMarkdown(saved: SavedSearch[]): string {
  return saved.map(s => {
    const sources = s.result.sources.map(src => `- [${src.id}] [${src.title}](${src.url})`).join("\n");
    return `# ${s.query}\n\n${s.result.answer}\n\n## Sources\n${sources}\n\n---\n`;
  }).join("\n");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ExportSavedSearches = ({ saved }: Props) => {
  const [exporting, setExporting] = useState(false);

  const exportMarkdown = () => {
    const md = generateMarkdown(saved);
    downloadFile(md, "saved-searches.md", "text/markdown");
    toast.success("Exported as Markdown");
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - margin * 2;
      let y = 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Saved Web Searches", margin, y);
      y += 12;

      saved.forEach((s, idx) => {
        if (y > 260) { doc.addPage(); y = 20; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`${idx + 1}. ${s.query}`, margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(s.result.answer.replace(/[#*`]/g, ""), maxWidth);
        for (const line of lines) {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += 4.5;
        }
        y += 4;

        if (s.result.sources.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text("Sources:", margin, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          s.result.sources.forEach(src => {
            if (y > 280) { doc.addPage(); y = 20; }
            doc.text(`[${src.id}] ${src.title}`, margin + 2, y);
            y += 4;
          });
        }
        y += 8;
      });

      doc.save("saved-searches.pdf");
      toast.success("Exported as PDF");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  if (saved.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={exporting}>
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportMarkdown}>
          <FileText className="h-4 w-4 mr-2" /> Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF}>
          <FileDown className="h-4 w-4 mr-2" /> PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
