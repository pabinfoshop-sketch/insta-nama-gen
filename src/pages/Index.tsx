import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileCard } from "@/components/ProfileCard";
import { Instagram, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ProfileSuggestion {
  username: string;
  bio: string;
  imageUrl: string;
}

const Index = () => {
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shortNames, setShortNames] = useState(false);
  const [profileCount, setProfileCount] = useState([5]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Ops!",
        description: "Por favor, digite uma palavra-chave para gerar sugestões.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-profile", {
        body: { 
          keyword: keyword.trim(),
          shortNames,
          count: profileCount[0],
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        toast({
          title: "Perfis gerados!",
          description: `${data.suggestions.length} sugestões criadas com sucesso.`,
        });
      }
    } catch (error: any) {
      console.error("Error generating profiles:", error);
      toast({
        title: "Erro ao gerar perfis",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-vibrant">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Instagram className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white">InstaName</h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Crie nomes únicos de perfil para Instagram com biografia e foto geradas por IA
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Digite seu nome ou palavra-chave..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
                  className="flex-1 h-14 text-lg bg-white/95 border-none placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  size="lg"
                  className="h-14 px-8 bg-white text-primary hover:bg-white/90 font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Gerar Perfis
                    </>
                  )}
                </Button>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-6 pt-4 border-t border-white/20">
                {/* Short Names Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="short-names" className="text-white font-medium">
                      Nomes Curtos
                    </Label>
                    <p className="text-sm text-white/70">Gerar apenas nomes de usuário curtos</p>
                  </div>
                  <Switch
                    id="short-names"
                    checked={shortNames}
                    onCheckedChange={setShortNames}
                    disabled={isLoading}
                  />
                </div>

                {/* Profile Count Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profile-count" className="text-white font-medium">
                      Quantidade de Perfis
                    </Label>
                    <span className="text-white font-semibold text-lg">{profileCount[0]}</span>
                  </div>
                  <Slider
                    id="profile-count"
                    min={3}
                    max={100}
                    step={1}
                    value={profileCount}
                    onValueChange={setProfileCount}
                    disabled={isLoading}
                    className="w-full"
                  />
                  <p className="text-sm text-white/70">De 3 até 100 perfis por geração</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {suggestions.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Suas Sugestões de Perfil
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {suggestions.map((suggestion, index) => (
                <ProfileCard
                  key={index}
                  username={suggestion.username}
                  bio={suggestion.bio}
                  imageUrl={suggestion.imageUrl}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && suggestions.length === 0 && (
          <div className="text-center text-white/70 py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Digite uma palavra-chave e clique em "Gerar Perfis" para começar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
