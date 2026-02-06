'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Phone,
  Plus,
  Tag,
  Users,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  FileText,
  MapPin,
  Contact,
  HardDrive,
  Loader2,
  Check,
  X,
  ChevronDown,
  Save,
  Download,
  Play,
  ExternalLink
} from 'lucide-react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { TeamDataWithMembers, Message } from '@/lib/db/schema';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

type Agent = Pick<import('@/lib/db/schema').User, 'id' | 'name' | 'email'>;

type ChatDetails = {
    remoteJid: string | null;
    name?: string | null;
    profilePicUrl?: string | null;
};

interface ChatSidebarProps {
    chatDetails: ChatDetails;
}

type Tag = {
  id: number;
  name: string;
  color: string;
};

type FunnelStage = {
  id: number;
  name: string;
  emoji: string;
  order: number;
};

type ContactData = {
  id: number;
  name: string;
  assignedUser: Agent | null;
  funnelStage: FunnelStage | null;
  tags: Tag[];
  notes: string | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function MediaGrid({ type, remoteJid, instanceId }: { type: string, remoteJid: string, instanceId: string | null }) {
    const t = useTranslations('chat_Sidebar');
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    
    const url = instanceId 
      ? `/api/chats/media?jid=${remoteJid}&type=${type}&instanceId=${instanceId}`
      : `/api/chats/media?jid=${remoteJid}&type=${type}`;

    const { data: mediaItems, isLoading } = useSWR<Message[]>(url, fetcher);

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>;
    if (!mediaItems || mediaItems.length === 0) return <p className="text-sm text-center text-muted-foreground p-4">{t('media.no_items')}</p>;

    const slides = mediaItems.map((item) => {
        if (type === 'videos') {
            return {
                type: "video" as const,
                width: 1280,
                height: 720,
                sources: [
                    {
                        src: item.mediaUrl || "",
                        type: item.mediaMimetype || "video/mp4"
                    }
                ]
            };
        }
        return { src: item.mediaUrl || "" };
    });

    return (
        <>
            <div className="grid grid-cols-3 gap-2 p-1">
                {mediaItems.map((item, index) => (
                    <div 
                        key={item.id} 
                        className="relative aspect-square bg-muted rounded overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxIndex(index)}
                    >
                        {type === 'videos' ? (
                           <>
                                <video src={item.mediaUrl || undefined} className="w-full h-full object-cover opacity-80 pointer-events-none" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="h-6 w-6 text-white fill-white opacity-80" />
                                </div>
                            </>
                        ) : (
                            <img src={item.mediaUrl || undefined} alt="Media" className="w-full h-full object-cover" />
                        )}
                    </div>
                ))}
            </div>

            <Lightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex}
                close={() => setLightboxIndex(-1)}
                slides={slides}
                plugins={[Zoom, Video]}
            />
        </>
    );
}

function MediaList({ type, remoteJid, instanceId }: { type: string, remoteJid: string, instanceId: string | null }) {
    const t = useTranslations('chat_Sidebar');
    
    const url = instanceId 
      ? `/api/chats/media?jid=${remoteJid}&type=${type}&instanceId=${instanceId}`
      : `/api/chats/media?jid=${remoteJid}&type=${type}`;

    const { data: mediaItems, isLoading } = useSWR<Message[]>(url, fetcher);

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>;
    if (!mediaItems || mediaItems.length === 0) return <p className="text-sm text-center text-muted-foreground p-4">{t('media.no_items')}</p>;

    return (
        <div className="space-y-2 p-1">
            {mediaItems.map((item) => (
                <div key={item.id} className="flex items-center p-2 bg-card border rounded-md hover:bg-muted transition-colors">
                    <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-full shrink-0 mr-3 text-muted-foreground">
                        {type === 'audio' && <Mic className="h-5 w-5" />}
                        {type === 'docs' && <FileText className="h-5 w-5" />}
                        {type === 'location' && <MapPin className="h-5 w-5" />}
                        {type === 'contacts' && <Contact className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium truncate">
                             {item.text || item.mediaCaption || item.contactName || item.locationName || (type === 'audio' ? t('media.audio') : t('media.file'))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                    </div>
                    {(item.mediaUrl || item.locationLatitude) && (
                         <a 
                            href={item.mediaUrl || `http://googleusercontent.com/maps.google.com/?q=${item.locationLatitude},${item.locationLongitude}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-muted-foreground hover:text-primary"
                         >
                             {type === 'location' ? <ExternalLink className="h-4 w-4"/> : <Download className="h-4 w-4"/>}
                         </a>
                    )}
                </div>
            ))}
        </div>
    );
}

interface SaveContactDialogProps {
  chatDetails: ChatDetails;
  onContactSaved: () => void;
  agents: Agent[];
}

function SaveContactDialog({ chatDetails, onContactSaved, agents }: SaveContactDialogProps) {
  const t = useTranslations('chat_Sidebar');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState(chatDetails.name || chatDetails.remoteJid?.split('@')[0] || '');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [stageId, setStageId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState('');

  const { data: allTags } = useSWR<Tag[]>('/api/tags', fetcher);
  const { data: funnelStages } = useSWR<FunnelStage[]>('/api/funnel-stages', fetcher);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatDetails.remoteJid || !name.trim()) {
      toast.error(t('contact_dialog.error_name_required'));
      return;
    }
    setIsSaving(true);

    try {
      const body = {
        jid: chatDetails.remoteJid,
        name: name.trim(),
        assignedUserId: agentId ? parseInt(agentId) : null,
        funnelStageId: stageId ? parseInt(stageId) : null,
        notes: notes.trim(),
        tagIds: Array.from(selectedTags),
      };

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('contact_dialog.error_save_failed'));
      }

      toast.success(t('contact_dialog.success_saved'));
      onContactSaved();
      setIsOpen(false);
    
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <Save className="h-4 w-4 mr-2" />
          {t('contact_dialog.trigger_btn')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('contact_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('contact_dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">{t('contact_dialog.name_label')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agent" className="text-right">{t('contact_dialog.agent_label')}</Label>
              <Select onValueChange={setAgentId} value={agentId || 'null'}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder={t('contact_dialog.nobody_option')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">{t('contact_dialog.nobody_option')}</SelectItem>
                  {agents?.map((agent) => (<SelectItem key={agent.id} value={agent.id.toString()}>{agent.name || agent.email}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="funnel" className="text-right">{t('contact_dialog.funnel_label')}</Label>
              <Select onValueChange={setStageId} value={stageId || 'null'}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder={t('contact_dialog.no_stage_option')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">{t('contact_dialog.no_stage_option')}</SelectItem>
                  {funnelStages?.map((stage) => (<SelectItem key={stage.id} value={stage.id.toString()}>{stage.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="tags" className="text-right pt-2">{t('contact_dialog.tags_label')}</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <Tag className="h-4 w-4 mr-2" />
                      {selectedTags.size > 0 ? t('contact_dialog.tags_selected', {count: selectedTags.size}) : t('contact_dialog.select_tags')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder={t('contact_dialog.search_tags')} />
                      <CommandList>
                        <CommandEmpty>{t('contact_dialog.no_tags_found')}</CommandEmpty>
                        <CommandGroup>
                          {allTags?.map((tag) => (
                            <CommandItem key={tag.id} onSelect={() => {
                                setSelectedTags(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(tag.id)) newSet.delete(tag.id); else newSet.add(tag.id);
                                  return newSet;
                                });
                              }}>
                              <Check className={`mr-2 h-4 w-4 ${selectedTags.has(tag.id) ? "opacity-100" : "opacity-0"}`} />
                              {tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">{t('contact_dialog.notes_label')}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" placeholder={t('contact_dialog.notes_placeholder')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>{t('contact_dialog.cancel_btn')}</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t('contact_dialog.save_btn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ChatSidebar({ chatDetails }: ChatSidebarProps) {
  const t = useTranslations('chat_Sidebar');
  const searchParams = useSearchParams();
  const instanceId = searchParams.get('instanceId');

  const [isAssigningAgent, setIsAssigningAgent] = useState(false);
  const [isSettingFunnel, setIsSettingFunnel] = useState(false);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('images');

  const number = chatDetails.remoteJid ? chatDetails.remoteJid.split('@')[0] : '...';
  const name = chatDetails.name || number;
  const remoteJid = chatDetails.remoteJid;

  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const agents: Agent[] = teamData?.teamMembers.map(tm => tm.user) || [];

  const swrKey = remoteJid 
    ? (instanceId ? `/api/contacts/by-chat?jid=${remoteJid}&instanceId=${instanceId}` : `/api/contacts/by-chat?jid=${remoteJid}`) 
    : null;
    
  const { data: contact, error: contactError, mutate: mutateContact, isLoading } = useSWR<ContactData | null>(swrKey, fetcher);

  const { data: allTags, mutate: mutateTags } = useSWR<Tag[]>('/api/tags', fetcher);
  const { data: funnelStages } = useSWR<FunnelStage[]>('/api/funnel-stages', fetcher);

  useEffect(() => {
    if (contact) setLocalNotes(contact.notes || "");
    else setLocalNotes("");
  }, [contact?.id, contact?.notes]);

  const handleSaveNotes = async () => {
    if (!contact) return;
    setIsSavingNotes(true);
    mutateContact((prevData) => { if (!prevData) return prevData; return { ...prevData, notes: localNotes }; }, false);

    try {
      const res = await fetch(`/api/contacts/${contact.id}/notes`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: localNotes }),
      });
      if (!res.ok) throw new Error(t('toasts.notes_save_failed'));
      toast.success(t('toasts.notes_updated'));
    } catch (error) {
      toast.error(t('toasts.notes_save_failed'));
      mutateContact();
    } finally { setIsSavingNotes(false); }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!contact) return;
    const newAgentId = agentId === 'null' ? null : parseInt(agentId, 10);
    const oldAgent = contact.assignedUser;
    mutateContact((prev) => { if (!prev) return prev; const newAgent = agents.find(a => a.id === newAgentId) || null; return { ...prev, assignedUser: newAgent }; }, false);
    setIsAssigningAgent(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/assign-agent`, { method: 'PUT', body: JSON.stringify({ agentId: newAgentId }), });
      if (!res.ok) throw new Error();
      toast.success(newAgentId ? t('toasts.agent_assigned') : t('toasts.agent_removed'));
    } catch (error) {
      toast.error(t('toasts.agent_save_error'));
      mutateContact((prev) => ({ ...prev!, assignedUser: oldAgent }), false);
    } finally { setIsAssigningAgent(false); mutateContact(); }
  };

  const handleSetFunnelStage = async (stageId: string) => {
    if (!contact) return;
    const newStageId = stageId === 'null' ? null : parseInt(stageId, 10);
    const oldStage = contact.funnelStage;
    mutateContact((prev) => { if (!prev) return prev; const newStage = funnelStages?.find(s => s.id === newStageId) || null; return { ...prev, funnelStage: newStage }; }, false);
    setIsSettingFunnel(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/funnel-stage`, { method: 'PUT', body: JSON.stringify({ stageId: newStageId }), });
      if (!res.ok) throw new Error();
      toast.success(t('toasts.stage_updated'));
    } catch (error) {
      toast.error(t('toasts.stage_save_error'));
      mutateContact((prev) => ({ ...prev!, funnelStage: oldStage }), false);
    } finally { setIsSettingFunnel(false); mutateContact(); }
  };

  const handleToggleTag = async (tag: Tag, forceRemove = false) => {
    if (!contact) return;
    const contactHasTag = contact.tags.some(t => t.id === tag.id);
    const shouldRemove = contactHasTag || forceRemove;
    mutateContact((prev) => { if (!prev) return prev; const newTags = shouldRemove ? prev.tags.filter(t => t.id !== tag.id) : [...prev.tags, tag]; return { ...prev, tags: newTags }; }, false);
    try {
      const url = `/api/contacts/${contact.id}/tags/${shouldRemove ? tag.id : ''}`;
      const method = shouldRemove ? 'DELETE' : 'POST';
      const res = await fetch(url, { method: method, body: shouldRemove ? null : JSON.stringify({ tagId: tag.id }), });
      if (!res.ok) throw new Error();
      toast.success(shouldRemove ? t('toasts.tag_removed', {name: tag.name}) : t('toasts.tag_added', {name: tag.name}));
    } catch (error) {
      toast.error(t('toasts.tag_update_error'));
      mutateContact();
    } finally { mutateContact(); }
  };

  const handleCreateAndAddTag = async (tagName: string) => {
    if (!contact || !tagName.trim()) return;
    setNewTagName("");
    setIsTagPopoverOpen(false);
    try {
      const resCreate = await fetch('/api/tags', { method: 'POST', body: JSON.stringify({ name: tagName }) });
      const newTag: Tag = await resCreate.json();
      if (!resCreate.ok) {
         if (resCreate.status === 409) {
            const existingTag = allTags?.find(t => t.name === tagName);
            if (existingTag) await handleToggleTag(existingTag);
         } else throw new Error((newTag as any).error || t('toasts.tag_create_failed'));
      } else {
        mutateTags((prevTags = []) => [...prevTags, newTag], false);
        await handleToggleTag(newTag);
      }
    } catch (error: any) {
      toast.error(error.message || t('toasts.tag_create_error'));
      mutateTags();
    }
  };

  const availableTags = useMemo(() => {
    const contactTagIds = new Set(contact?.tags.map(t => t.id));
    return allTags?.filter(t => !contactTagIds.has(t.id)) || [];
  }, [allTags, contact]);

  const renderLoading = () => (<div className="flex-1 overflow-y-auto p-4 space-y-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>);
  const renderError = (message: string) => (<div className="flex-1 overflow-y-auto p-4 space-y-6"><p className="text-center text-destructive">{message}</p></div>);
  
  const renderSidebarContent = () => {
    if (!remoteJid) return <div className="p-4 text-center text-sm text-muted-foreground">{t('main.select_chat_hint')}</div>;
    if (isLoading) return renderLoading();
    if (contactError) return renderError(t('main.error_loading'));

    if (!contact) {
      return (
        <div className="p-4 space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50 text-center">
             <h3 className="font-medium text-lg">{name}</h3>
             <p className="text-sm text-muted-foreground">+{number}</p>
             <p className="text-sm text-muted-foreground mt-2">{t('main.not_in_crm')}</p>
          </div>
          <SaveContactDialog chatDetails={chatDetails} onContactSaved={() => mutateContact()} agents={agents} />
          
          <div className="space-y-2 mt-6">
              <h3 className="font-medium flex items-center mb-2"><HardDrive className="h-4 w-4 mr-2 text-muted-foreground" /> {t('media.assets_title')}</h3>
              <Tabs value={activeMediaTab} onValueChange={setActiveMediaTab}>
                <TabsList className="grid w-full grid-cols-6 h-12">
                  <TabsTrigger value="images" className="h-10"><ImageIcon className="h-5 w-5" /></TabsTrigger>
                  <TabsTrigger value="videos" className="h-10"><VideoIcon className="h-5 w-5" /></TabsTrigger>
                  <TabsTrigger value="audio" className="h-10"><Mic className="h-5 w-5" /></TabsTrigger>
                  <TabsTrigger value="docs" className="h-10"><FileText className="h-5 w-5" /></TabsTrigger>
                  <TabsTrigger value="location" className="h-10"><MapPin className="h-5 w-5" /></TabsTrigger>
                  <TabsTrigger value="contacts" className="h-10"><Contact className="h-5 w-5" /></TabsTrigger>
                </TabsList>
                <div className="mt-2 border rounded-md min-h-[100px] max-h-[300px] overflow-y-auto">
                    {['images', 'videos'].includes(activeMediaTab) 
                        ? <MediaGrid type={activeMediaTab} remoteJid={remoteJid} instanceId={instanceId} />
                        : <MediaList type={activeMediaTab} remoteJid={remoteJid} instanceId={instanceId} />
                    }
                </div>
              </Tabs>
          </div>
        </div>
      );
    }

    const displayName = contact.name || name;

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex flex-col items-center mb-4">
            <Avatar className="h-16 w-16 mb-2">
              <AvatarImage src={chatDetails.profilePicUrl || undefined} alt={displayName} />
              <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="font-medium text-lg">{displayName}</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground" /><span className="font-medium truncate">{displayName}</span></div>
            <div className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted-foreground" /><span className="font-medium truncate">+{number}</span></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2"><h3 className="font-medium flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" /> {t('main.tags_title')}</h3>
            <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
              <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-7"><Plus className="h-3 w-3 mr-1" /> {t('main.add_tag_btn')}</Button></PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <Command>
                  <CommandInput placeholder={t('contact_dialog.search_tags')} value={newTagName} onValueChange={setNewTagName} />
                  <CommandList>
                    <CommandEmpty><Button variant="ghost" size="sm" className="w-full" onClick={() => handleCreateAndAddTag(newTagName)}>{t('main.create_and_add', {name: newTagName})}</Button></CommandEmpty>
                    <CommandGroup heading={t('main.existing_tags')}>
                      {availableTags.map((tag) => (
                        <CommandItem key={tag.id} onSelect={() => { handleToggleTag(tag); setIsTagPopoverOpen(false); }}>
                          <Check className={`mr-2 h-4 w-4 ${contact.tags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"}`} /> {tag.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[20px]">
            {contact.tags.length > 0 ? (contact.tags.map((tag) => (<Badge key={tag.id} variant="secondary" className="group">{tag.name}<button onClick={() => handleToggleTag(tag, true)} className="ml-1 opacity-50 group-hover:opacity-100"><X className="h-3 w-3" /></button></Badge>))) : (<p className="text-xs text-muted-foreground">{t('main.no_tags')}</p>)}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium flex items-center mb-2"><Users className="h-4 w-4 mr-2 text-muted-foreground" /> {t('main.assign_agent_title')}</h3>
          <Select onValueChange={handleAssignAgent} value={contact.assignedUser?.id?.toString() || 'null'} disabled={isAssigningAgent}>
            <SelectTrigger><SelectValue placeholder={t('main.agents_placeholder')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="null">{t('contact_dialog.nobody_option')}</SelectItem>
              {agents.map((agent) => (<SelectItem key={agent.id} value={agent.id.toString()}>{agent.name || agent.email}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium flex items-center mb-2"><ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" /> {t('main.funnel_stage_title')}</h3>
          <Select onValueChange={handleSetFunnelStage} value={contact.funnelStage?.id?.toString() || 'null'} disabled={isSettingFunnel || !funnelStages}>
            <SelectTrigger><SelectValue placeholder={t('main.define_stage_placeholder')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="null">{t('contact_dialog.no_stage_option')}</SelectItem>
              {funnelStages?.map((stage) => (
                <SelectItem key={stage.id} value={stage.id.toString()}>
                   {stage.emoji} {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
           <div className="flex justify-between items-center mb-2">
             <h3 className="font-medium flex items-center"><FileText className="h-4 w-4 mr-2 text-muted-foreground" /> {t('main.notes_title')}</h3>
             {localNotes !== (contact.notes || "") && (
               <Button size="sm" variant="ghost" onClick={handleSaveNotes} disabled={isSavingNotes} className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-500 dark:hover:bg-green-900/20">
                 {isSavingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} {t('main.save_notes_btn')}
               </Button>
             )}
           </div>
          <Textarea value={localNotes} onChange={(e) => setLocalNotes(e.target.value)} className="min-h-[80px] resize-none bg-muted/50 focus:bg-background text-sm" placeholder={t('main.notes_placeholder')} />
        </div>

        <div className="space-y-2">
           <h3 className="font-medium flex items-center mb-2"><HardDrive className="h-4 w-4 mr-2 text-muted-foreground" /> {t('media.assets_title')}</h3>
           <Tabs value={activeMediaTab} onValueChange={setActiveMediaTab}>
            <TabsList className="grid w-full grid-cols-6 h-12">
              <TabsTrigger value="images" className="h-10"><ImageIcon className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="videos" className="h-10"><VideoIcon className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="audio" className="h-10"><Mic className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="docs" className="h-10"><FileText className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="location" className="h-10"><MapPin className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="contacts" className="h-10"><Contact className="h-5 w-5" /></TabsTrigger>
            </TabsList>
            
            <div className="mt-2 border rounded-md min-h-[100px] max-h-[300px] overflow-y-auto">
                {['images', 'videos'].includes(activeMediaTab) 
                    ? <MediaGrid type={activeMediaTab} remoteJid={remoteJid} instanceId={instanceId} />
                    : <MediaList type={activeMediaTab} remoteJid={remoteJid} instanceId={instanceId} />
                }
            </div>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <aside className="flex flex-col w-80 border-l bg-card shrink-0 h-screen">
      {renderSidebarContent()}
    </aside>
  );
}