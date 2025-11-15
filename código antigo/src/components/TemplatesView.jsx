import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Upload, Star, ThumbsUp, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRundown } from '@/contexts/RundownContext.jsx';

const TemplatesView = () => {
  const { toast } = useToast();
  const { handleDownloadTemplate } = useRundown();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const templates = [
    {
      id: 1,
      name: 'Transmissão de Futebol Completa',
      category: 'Esportes',
      author: 'João Silva',
      rating: 4.8,
      downloads: 1250,
      upvotes: 89,
      views: 3420,
      description: 'Template completo para transmissão de jogos de futebol com pré-jogo, intervalo e pós-jogo',
      tags: ['futebol', 'esportes', 'ao-vivo'],
      duration: '3h 30min',
      items: 12,
      preview: [
        'Abertura e Apresentação (5min)',
        'Análise Pré-Jogo (15min)',
        'Escalações (10min)',
        'Transmissão 1º Tempo (45min)',
        'Intervalo (15min)',
        'Transmissão 2º Tempo (45min)',
        'Análise Pós-Jogo (20min)'
      ],
      structure: [
        { id: 'folder-1', title: 'Pré-Jogo', type: 'folder', children: [
            { id: 'item-1-1', title: 'Abertura e Apresentação', duration: 300, description: 'Início da transmissão.', type: 'generic', status: 'pending', icon: 'Play', color: '#3b82f6', urgency: 'normal', reminder: '' },
            { id: 'item-1-2', title: 'Análise Pré-Jogo', duration: 900, description: 'Comentários sobre a partida.', type: 'generic', status: 'pending', icon: 'ClipboardList', color: '#3b82f6', urgency: 'normal', reminder: '' },
            { id: 'item-1-3', title: 'Escalações', duration: 600, description: 'Apresentação dos times.', type: 'generic', status: 'pending', icon: 'Users', color: '#3b82f6', urgency: 'normal', reminder: '' },
        ]},
        { id: 'folder-2', title: 'Partida', type: 'folder', children: [
            { id: 'item-2-1', title: 'Transmissão 1º Tempo', duration: 2700, description: 'Narração do primeiro tempo.', type: 'generic', status: 'pending', icon: 'Radio', color: '#ef4444', urgency: 'urgent', reminder: '' },
            { id: 'item-2-2', title: 'Intervalo', duration: 900, description: 'Análise e comentários.', type: 'generic', status: 'pending', icon: 'Coffee', color: '#f97316', urgency: 'attention', reminder: '' },
            { id: 'item-2-3', title: 'Transmissão 2º Tempo', duration: 2700, description: 'Narração do segundo tempo.', type: 'generic', status: 'pending', icon: 'Radio', color: '#ef4444', urgency: 'urgent', reminder: '' },
        ]},
        { id: 'folder-3', title: 'Pós-Jogo', type: 'folder', children: [
            { id: 'item-3-1', title: 'Análise Pós-Jogo', duration: 1200, description: 'Melhores momentos e comentários.', type: 'generic', status: 'pending', icon: 'ClipboardCheck', color: '#10b981', urgency: 'normal', reminder: '' },
        ]}
      ]
    },
    {
      id: 2,
      name: 'Telejornal Diário',
      category: 'Jornalismo',
      author: 'Maria Santos',
      rating: 4.6,
      downloads: 890,
      upvotes: 67,
      views: 2180,
      description: 'Estrutura padrão para telejornal com manchetes, reportagens e previsão do tempo',
      tags: ['jornalismo', 'notícias', 'diário'],
      duration: '1h 15min',
      items: 8,
      preview: [
        'Abertura (2min)',
        'Manchetes Principais (10min)',
        'Reportagem Especial (15min)',
        'Esportes (8min)',
        'Previsão do Tempo (5min)',
        'Encerramento (3min)'
      ],
      structure: [
        { id: 'folder-1', title: 'Bloco 1', type: 'folder', children: [
            { id: 'item-1-1', title: 'Abertura', duration: 120, description: 'Início do jornal.', type: 'generic', status: 'pending', icon: 'Play', color: '#3b82f6', urgency: 'normal', reminder: '' },
            { id: 'item-1-2', title: 'Manchetes Principais', duration: 600, description: 'Destaques do dia.', type: 'generic', status: 'pending', icon: 'Newspaper', color: '#3b82f6', urgency: 'normal', reminder: '' },
        ]},
        { id: 'folder-2', title: 'Bloco 2', type: 'folder', children: [
            { id: 'item-2-1', title: 'Reportagem Especial', duration: 900, description: 'Matéria aprofundada.', type: 'generic', status: 'pending', icon: 'Camera', color: '#ef4444', urgency: 'urgent', reminder: '' },
            { id: 'item-2-2', title: 'Esportes', duration: 480, description: 'Notícias do esporte.', type: 'generic', status: 'pending', icon: 'Trophy', color: '#f97316', urgency: 'attention', reminder: '' },
        ]},
        { id: 'folder-3', title: 'Encerramento', type: 'folder', children: [
            { id: 'item-3-1', title: 'Previsão do Tempo', duration: 300, description: 'Clima para os próximos dias.', type: 'generic', status: 'pending', icon: 'CloudSun', color: '#10b981', urgency: 'normal', reminder: '' },
            { id: 'item-3-2', title: 'Encerramento', duration: 180, description: 'Finalização do jornal.', type: 'generic', status: 'pending', icon: 'LogOut', color: '#10b981', urgency: 'normal', reminder: '' },
        ]}
      ]
    },
    {
      id: 3,
      name: 'Show Musical ao Vivo',
      category: 'Entretenimento',
      author: 'Carlos Música',
      rating: 4.9,
      downloads: 2100,
      upvotes: 156,
      views: 5670,
      description: 'Template para shows musicais com soundcheck, apresentações e interações com público',
      tags: ['música', 'show', 'entretenimento'],
      duration: '2h 45min',
      items: 15,
      preview: [
        'Soundcheck (30min)',
        'Abertura (10min)',
        'Primeira Música (4min)',
        'Interação com Público (5min)',
        'Segunda Música (4min)',
        'Intervalo (15min)'
      ],
      structure: []
    },
    {
      id: 4,
      name: 'Podcast Entrevista',
      category: 'Podcast',
      author: 'Ana Podcaster',
      rating: 4.7,
      downloads: 650,
      upvotes: 45,
      views: 1890,
      description: 'Estrutura para podcast de entrevista com introdução, perguntas e considerações finais',
      tags: ['podcast', 'entrevista', 'conversa'],
      duration: '45min',
      items: 6,
      preview: [
        'Introdução (3min)',
        'Apresentação do Convidado (5min)',
        'Bloco 1 - Carreira (15min)',
        'Bloco 2 - Projetos (15min)',
        'Perguntas Rápidas (5min)',
        'Encerramento (2min)'
      ],
      structure: []
    },
    {
      id: 5,
      name: 'Webinar Educativo',
      category: 'Educação',
      author: 'Prof. Eduardo',
      rating: 4.5,
      downloads: 420,
      upvotes: 32,
      views: 1250,
      description: 'Template para webinars educativos com apresentação, conteúdo e sessão de perguntas',
      tags: ['educação', 'webinar', 'ensino'],
      duration: '1h 30min',
      items: 7,
      preview: [
        'Boas-vindas (5min)',
        'Apresentação do Tema (10min)',
        'Conteúdo Principal (45min)',
        'Demonstração Prática (20min)',
        'Perguntas e Respostas (8min)',
        'Encerramento (2min)'
      ],
      structure: []
    },
    {
      id: 6,
      name: 'Evento Corporativo',
      category: 'Corporativo',
      author: 'Empresa XYZ',
      rating: 4.4,
      downloads: 780,
      upvotes: 58,
      views: 2340,
      description: 'Template para eventos corporativos com apresentações, palestrantes e networking',
      tags: ['corporativo', 'evento', 'negócios'],
      duration: '4h',
      items: 18,
      preview: [
        'Credenciamento (30min)',
        'Abertura Oficial (15min)',
        'Palestra Principal (60min)',
        'Coffee Break (30min)',
        'Mesa Redonda (45min)',
        'Networking (60min)'
      ],
      structure: []
    }
  ];

  const categories = ['all', 'Esportes', 'Jornalismo', 'Entretenimento', 'Podcast', 'Educação', 'Corporativo'];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'recent':
        return b.id - a.id;
      default:
        return 0;
    }
  });

  const handleUpvote = (template) => {
    toast({
      title: "👍 Upvote Registrado",
      description: `Você curtiu ${template.name}!`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Modelos de Rundown</h1>
          <p className="text-muted-foreground">Marketplace da comunidade com templates prontos</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={() => toast({ title: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀" })}
        >
          <Upload className="w-4 h-4 mr-2" />
          Enviar Template
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'Todas as Categorias' : category}
            </option>
          ))}
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
        >
          <option value="popular">Mais Populares</option>
          <option value="rating">Melhor Avaliados</option>
          <option value="recent">Mais Recentes</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">por {template.author}</p>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                {template.rating}
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {template.downloads}
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {template.upvotes}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {template.views}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Prévia ({template.items} itens • {template.duration})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {template.preview.map((item, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground bg-secondary rounded px-2 py-1">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-secondary/80 text-muted-foreground text-xs rounded">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleDownloadTemplate(template)}
              >
                <Download className="w-4 h-4 mr-1" />
                Baixar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleUpvote(template)}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum template encontrado</p>
            <p className="text-sm">Tente ajustar os filtros de busca</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/30 p-6 text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">Compartilhe seus Templates</h3>
        <p className="text-muted-foreground mb-4">
          Ajude a comunidade enviando seus rundowns e ganhe reconhecimento!
        </p>
        <Button 
          onClick={() => toast({ title: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀" })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Template
        </Button>
      </div>
    </div>
  );
};

export default TemplatesView;