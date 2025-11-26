import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProfileCardProps {
  username: string;
  bio: string;
  imageUrl: string;
}

export const ProfileCard = ({ username, bio, imageUrl }: ProfileCardProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copiado!",
      description: `${field} copiado para a área de transferência.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${username}-profile.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado!",
        description: "A imagem está sendo baixada.",
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Image */}
          <div className="relative group">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={imageUrl} alt={username} />
              <AvatarFallback className="text-2xl bg-gradient-vibrant text-white">
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadImage}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3"
            >
              <Download className="h-3 w-3 mr-1" />
              <span className="text-xs">Baixar</span>
            </Button>
          </div>

          {/* Username */}
          <div className="w-full">
            <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-4 py-2">
              <span className="font-semibold text-foreground flex-1 text-left">@{username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(username, "Nome de usuário")}
                className="h-8 w-8 p-0"
              >
                {copiedField === "Nome de usuário" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Bio */}
          <div className="w-full">
            <div className="bg-muted/50 rounded-lg px-4 py-3 min-h-[100px] relative">
              <p className="text-sm text-foreground/80 leading-relaxed mb-2">{bio}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bio, "Biografia")}
                className="h-8 px-3 absolute bottom-2 right-2"
              >
                {copiedField === "Biografia" ? (
                  <Check className="h-4 w-4 text-primary mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                <span className="text-xs">Copiar</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
