import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Star, ThumbsUp, Clock, Folder, Download, Upload, MoreVertical, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AuthContext from '@/contexts/AuthContext.jsx';
import { API_BASE_URL } from '@/config/api';
import * as XLSX from 'xlsx';

// Componente de Estrelas Interativo
const StarRating = ({ rating, ratingCount, templateId, onRate, isAuthenticated }) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isRating, setIsRating] = useState(false);

  const handleStarClick = async (starValue) => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para avaliar templates.",
        variant: "destructive"
      });
      return;
    }

    setIsRating(true);
    try {
      await onRate(templateId, starValue);
    } finally {
      setIsRating(false);
    }
  };

  const displayRating = rating || 0;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            disabled={isRating}
            className={`transition-colors ${
              isRating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= (hoveredStar || displayRating)
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-yellow-600 ml-1">
        {displayRating.toFixed(1)} ({ratingCount || 0})
      </span>
    </div>
  );
};

const TemplatesView = () => {
  const { toast } = useToast();
  const { token, user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedTemplates, setLikedTemplates] = useState(new Set());
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/templates`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const mapped = (data.templates || []).map((t) => ({
          id: t.id,
          name: t.name,
          author: t.author || 'Autor',
          description: t.description || '',
          likes: t.likes ?? t.likes_cached ?? 0,
          rating: t.rating_cached || 0,
          ratingCount: t.rating_count || 0,
          duration: t.duration || '0',
          tags: t.tags || [],
          itemsCount: t.items || 0,
          preview: t.preview || [],
          category: t.category || 'geral',
        }));
        setTemplates(mapped);
      } catch (e) {
        if (cancelled) return;
        setError('Não foi possível carregar os modelos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const handleImport = async (templateId) => {
    if (!token) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para importar templates.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao importar template');
      }

      const result = await response.json();
      
      toast({
        title: "Template Importado!",
        description: `O modelo foi adicionado aos seus projetos. ID: ${result.rundown_id}`,
      });

      // Atualiza o contador de downloads
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, downloads: (t.downloads || 0) + 1 }
          : t
      ));
      
      // Dispara evento para atualizar lista de rundowns
      // Isso permite que o RundownContext atualize a lista automaticamente
      // Usa setTimeout para garantir que o backend processou a criação antes de atualizar
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('rundownListChanged'));
      }, 500);

    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLike = async (templateId) => {
    if (!token) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir templates.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao curtir template');
      }

      const result = await response.json();
      
      // Atualiza o estado local
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, likes: result.likes }
          : t
      ));

      // Atualiza o estado de curtidas
      setLikedTemplates(prev => {
        const newSet = new Set(prev);
        if (result.liked) {
          newSet.add(templateId);
        } else {
          newSet.delete(templateId);
        }
        return newSet;
      });

      toast({
        title: result.liked ? "Template curtido!" : "Curtida removida",
        description: result.liked ? "Você curtiu este template." : "Você removeu a curtida.",
      });

    } catch (error) {
      toast({
        title: "Erro ao curtir",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRate = async (templateId, stars) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stars }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao avaliar template');
      }

      const result = await response.json();
      
      // Atualiza o estado local
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { 
              ...t, 
              rating: result.rating,
              ratingCount: result.rating_count
            }
          : t
      ));

      toast({
        title: "Avaliação registrada!",
        description: `Você avaliou este template com ${stars} estrela${stars > 1 ? 's' : ''}.`,
      });

    } catch (error) {
      toast({
        title: "Erro ao avaliar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Função para baixar template de exemplo do backend
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('http://192.168.0.100:3000/api/templates/download-example', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar template de exemplo');
      }

      // Converte a resposta para blob
      const blob = await response.blob();
      
      // Cria um link temporário para download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_exemplo.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Limpa
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download iniciado!",
        description: "O template de exemplo está sendo baixado.",
      });
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      toast({
        title: "Erro ao baixar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Função para processar arquivo Excel carregado
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verifica se é um arquivo válido
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv|txt)$/)) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls), CSV (.csv) ou texto (.txt)",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Verifica se é arquivo de texto
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Envia arquivo de texto diretamente
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://192.168.0.100:3000/api/templates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao enviar arquivo');
        }

        const result = await response.json();
        
        toast({
          title: "Templates enviados com sucesso!",
          description: `${result.count || 'Vários'} template(s) importado(s).`,
        });
      } else {
        // Processa Excel/CSV como antes
        let jsonData;
        
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          const text = await file.text();
          const workbook = XLSX.read(text, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        } else {
          // Lê o arquivo Excel
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }

        console.log('Dados extraídos:', jsonData);

        // Envia para o backend
        const response = await fetch('http://192.168.0.100:3000/api/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            templates: jsonData,
            source: 'excel_upload',
            uploaded_by: user?.id
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao enviar templates');
        }

        const result = await response.json();
        
        toast({
          title: "Templates enviados com sucesso!",
          description: `${result.count || jsonData.length} template(s) importado(s).`,
        });
      }
      
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Recarrega a lista de templates
      const res = await fetch(`${API_BASE_URL}/api/templates`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.templates || []).map((t) => ({
          id: t.id,
          name: t.name,
          author: t.author || 'Autor',
          description: t.description || '',
          likes: t.likes ?? t.likes_cached ?? 0,
          rating: t.rating_cached || 0,
          ratingCount: t.rating_count || 0,
          duration: t.duration || '0',
          tags: t.tags || [],
          itemsCount: t.items || 0,
          preview: t.preview || [],
          category: t.category || 'geral',
        }));
        setTemplates(mapped);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Função para abrir seletor de arquivo
  const handleUploadClick = () => {
    if (!token) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para enviar templates.",
        variant: "destructive"
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const filteredTemplates = templates
    .filter((template) => {
      const matchesSearch = (template.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) || (template.description || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || template.category?.toLowerCase() === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          return (b.id || 0) - (a.id || 0);
        case 'popular':
        default:
          return (b.likes || 0) - (a.likes || 0);
      }
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Gradiente Vermelho */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Modelos de Projetos</h1>
              <p className="text-white/90 text-lg">
                Modelos da comunidade com templates prontos
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadTemplate}
                className="bg-white hover:bg-white/90 text-red-600 font-semibold gap-2 h-11 px-6"
              >
                <Download className="w-5 h-5" />
                Baixar Exemplo
              </Button>
              <Button
                onClick={handleUploadClick}
                disabled={uploading}
                className="bg-white hover:bg-white/90 text-red-600 font-semibold gap-2 h-11 px-6"
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'Enviando...' : 'Enviar Template'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Input de arquivo (escondido) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Barra de Busca e Filtros */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar Modelos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-11 px-4">
                  Todos os tipos
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  Todos os tipos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('esportes')}>
                  Esportes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('shows')}>
                  Shows
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-11 px-4">
                  Mais Populares
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortBy('popular')}>
                  Mais Populares
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('recent')}>
                  Mais Recentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('rating')}>
                  Melhor Avaliados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Grid de Templates */}
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Carregando modelos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all relative"
              >
                {/* Menu 3 Pontos */}
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Denunciar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Título e Autor */}
                <h3 className="font-bold text-lg mb-1 pr-8">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Por {template.author}
                </p>

                {/* Descrição */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Avaliação por Estrelas */}
                <div className="mb-4">
                  <StarRating
                    rating={template.rating}
                    ratingCount={template.ratingCount}
                    templateId={template.id}
                    onRate={handleRate}
                    isAuthenticated={!!token}
                  />
                </div>

                {/* Stats (Likes) */}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => handleLike(template.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likedTemplates.has(template.id)
                        ? 'text-red-600'
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        likedTemplates.has(template.id) ? 'fill-red-600' : ''
                      }`} 
                    />
                    <span className="text-sm font-semibold">{template.likes}</span>
                  </button>
                </div>

                {/* Prévia e Duração */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-4 h-4" />
                    <span>Prévia ({template.itemsCount} itens)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{template.duration}</span>
                  </div>
                </div>

                {/* Lista de Itens (com scroll) */}
                <div className="mb-4 max-h-32 overflow-y-auto pr-2 space-y-1.5 scrollbar-thin">
                  {template.preview.map((line, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">{line}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Botões */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                    onClick={() => handleImport(template.id)}
                  >
                    <Download className="w-4 h-4" />
                    Importar Projeto
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Adicionar scrollbar style customizado */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: hsl(var(--secondary));
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default TemplatesView;
