'use client';

import React, { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { 
    Search, User as UserIcon, Filter, MoreVertical, 
    Edit, Trash2, Phone, 
    Save, X, Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Contact = {
    id: number;
    name: string;
    phone?: string;
    profilePicUrl?: string;
    notes?: string;
    assignedUser?: { id: number; name: string; email: string };
    funnelStage?: { id: number; name: string };
    tags: { id: number; name: string; color: string }[];
};

export default function ContactsPage() {
    const t = useTranslations('ContactsPage');
    const { data: contacts, isLoading } = useSWR<Contact[]>('/api/contacts/list', fetcher);
    const { data: teamData } = useSWR('/api/team', fetcher);
    const { data: funnelStages } = useSWR<any[]>('/api/funnel-stages', fetcher);
    const { data: allTags } = useSWR<any[]>('/api/tags', fetcher);
    
    const agents = teamData?.teamMembers?.map((tm: any) => tm.user) || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editAgentId, setEditAgentId] = useState<string>('null');
    const [editStageId, setEditStageId] = useState<string>('null');
    const [editTagIds, setEditTagIds] = useState<Set<number>>(new Set());

    const filteredContacts = useMemo(() => {
        if (!contacts) return [];
        return contacts.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.phone && c.phone.includes(searchQuery))
        );
    }, [contacts, searchQuery]);

    const handleEditClick = (contact: Contact) => {
        setSelectedContact(contact);
        setEditName(contact.name);
        setEditNotes(contact.notes || '');
        setEditAgentId(contact.assignedUser?.id.toString() || 'null');
        setEditStageId(contact.funnelStage?.id.toString() || 'null');
        setEditTagIds(new Set(contact.tags.map(t => t.id)));
        setIsEditOpen(true);
    };

    const handleDeleteClick = (contact: Contact) => {
        setSelectedContact(contact);
        setIsDeleteOpen(true);
    };

    const handleSave = async () => {
        if (!selectedContact) return;
        setIsSaving(true);
        try {
            const body = {
                name: editName,
                notes: editNotes,
                assignedUserId: editAgentId === 'null' ? null : editAgentId,
                funnelStageId: editStageId === 'null' ? null : editStageId,
                tagIds: Array.from(editTagIds)
            };

            const res = await fetch(`/api/contacts/${selectedContact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to update');
            
            mutate('/api/contacts/list');
            toast.success(t('toasts.update_success'));
            setIsEditOpen(false);
        } catch (error) {
            toast.error(t('toasts.update_error'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedContact) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/contacts/${selectedContact.id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            
            mutate('/api/contacts/list');
            toast.success(t('toasts.delete_success'));
            setIsDeleteOpen(false);
        } catch (error) {
            toast.error(t('toasts.delete_error'));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (tagId: number) => {
        const newSet = new Set(editTagIds);
        if (newSet.has(tagId)) newSet.delete(tagId);
        else newSet.add(tagId);
        setEditTagIds(newSet);
    };

    return (
        <div className="flex flex-col h-full bg-muted p-6 overflow-hidden">
            <header className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('header_title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('header_subtitle')}</p>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-4 shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={t('search_placeholder')} 
                        className="pl-10 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="bg-background"><Filter className="h-4 w-4 mr-2" /> {t('filter_btn')}</Button>
                </div>
            </div>

            {/* Data Table / List */}
            <div className="flex-1 bg-background rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-4">{t('table_header.contact')}</div>
                    <div className="col-span-2">{t('table_header.stage')}</div>
                    <div className="col-span-2">{t('table_header.agent')}</div>
                    <div className="col-span-3">{t('table_header.tags')}</div>
                    <div className="col-span-1 text-right">{t('table_header.actions')}</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <UserIcon className="h-12 w-12 mb-2 opacity-20" />
                            <p>{t('no_contacts_found')}</p>
                        </div>
                    ) : (
                        filteredContacts.map(contact => (
                            <div key={contact.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-muted transition-colors items-center">
                                {/* Name & Phone */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-border">
                                        <AvatarImage src={contact.profilePicUrl} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="font-medium text-foreground truncate">{contact.name}</p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3 mr-1" />
                                            {contact.phone || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Funnel Stage */}
                                <div className="col-span-2">
                                    {contact.funnelStage ? (
                                        <Badge variant="outline" className="bg-muted font-normal border-border">
                                            {contact.funnelStage.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">{t('no_stage')}</span>
                                    )}
                                </div>

                                {/* Agent */}
                                <div className="col-span-2 flex items-center gap-2">
                                    {contact.assignedUser ? (
                                        <>
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                    {contact.assignedUser.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-foreground truncate">{contact.assignedUser.name}</span>
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">{t('unassigned')}</span>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="col-span-3 flex flex-wrap gap-1">
                                    {contact.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 h-5">
                                            {tag.name}
                                        </Badge>
                                    ))}
                                    {contact.tags.length > 3 && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5">+{contact.tags.length - 3}</Badge>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditClick(contact)}>
                                                <Edit className="h-4 w-4 mr-2" /> {t('edit_menu')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteClick(contact)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> {t('delete_menu')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Slide-over */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('edit_dialog.title')}</DialogTitle>
                        <DialogDescription>{t('edit_dialog.description')}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="c-name">{t('edit_dialog.name_label')}</Label>
                            <Input id="c-name" value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t('edit_dialog.stage_label')}</Label>
                                <Select value={editStageId} onValueChange={setEditStageId}>
                                    <SelectTrigger><SelectValue placeholder={t('edit_dialog.select_stage')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">{t('edit_dialog.no_stage_option')}</SelectItem>
                                        {funnelStages?.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('edit_dialog.agent_label')}</Label>
                                <Select value={editAgentId} onValueChange={setEditAgentId}>
                                    <SelectTrigger><SelectValue placeholder={t('edit_dialog.assign_to_placeholder')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">{t('edit_dialog.unassigned_option')}</SelectItem>
                                        {agents.map((a: any) => (
                                            <SelectItem key={a.id} value={a.id.toString()}>{a.name || a.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('edit_dialog.tags_label')}</Label>
                            <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px] bg-muted/50">
                                {allTags?.map((tag: any) => {
                                    const isSelected = editTagIds.has(tag.id);
                                    return (
                                        <Badge 
                                            key={tag.id} 
                                            variant={isSelected ? "default" : "outline"}
                                            className={`cursor-pointer select-none ${!isSelected ? 'bg-background text-foreground hover:bg-muted' : ''}`}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.name}
                                            {isSelected && <X className="h-3 w-3 ml-1" />}
                                        </Badge>
                                    );
                                })}
                                {(!allTags || allTags.length === 0) && <span className="text-xs text-muted-foreground">{t('edit_dialog.no_tags_avail')}</span>}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="c-notes">{t('edit_dialog.notes_label')}</Label>
                            <Textarea id="c-notes" value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={4} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)}>{t('edit_dialog.cancel_btn')}</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            {t('edit_dialog.save_btn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('delete_dialog.title')}</DialogTitle>
                        <DialogDescription dangerouslySetInnerHTML={{ __html: t.raw('delete_dialog.description').replace('{name}', selectedContact?.name || '') }} />
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>{t('delete_dialog.cancel_btn')}</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>
                            {isSaving ? t('delete_dialog.deleting_btn') : t('delete_dialog.confirm_btn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}