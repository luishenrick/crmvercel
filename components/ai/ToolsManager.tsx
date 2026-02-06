'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, UploadCloud, FileText, Image as ImageIcon, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { createAiTool, deleteAiTool, getAiTools } from '@/app/[locale]/(dashboard)/settings/ai/tools-actions';
import useSWR from 'swr';

export function ToolsManager() {
  const { data: tools, mutate } = useSWR('ai-tools', getAiTools);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [caption, setCaption] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Reusing the existing automation upload route
        const res = await fetch('/api/automation/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.url) {
            setMediaUrl(data.url);
            setFileName(data.filename);
            
            const mime = data.mimetype || '';
            if(mime.startsWith('image')) setMediaType('image');
            else if(mime.startsWith('video')) setMediaType('video');
            else if(mime.startsWith('audio')) setMediaType('audio');
            else setMediaType('document');
            
            toast.success("File uploaded");
        }
    } catch (err) {
        toast.error("Upload failed");
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || !mediaUrl) {
        toast.error("Name, description and file are required");
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('mediaUrl', mediaUrl);
    formData.append('mediaType', mediaType);
    formData.append('caption', caption);
    formData.append('confirmationMessage', confirmationMessage);

    const result = await createAiTool(formData);
    
    if (result.success) {
        toast.success("Tool created");
        mutate();
        setIsDialogOpen(false);
        resetForm();
    } else {
        toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure?")) return;
      await deleteAiTool(id);
      mutate();
      toast.success("Tool removed");
  };

  const resetForm = () => {
      setName(''); setDescription(''); setCaption(''); setConfirmationMessage('');
      setMediaUrl(''); setFileName('');
  };

  return (
    <Card className="mt-6">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Function Calling (AI Tools)</CardTitle>
                    <CardDescription>Create custom tools for the AI to send files automatically.</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4"/> New Tool</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Tool</DialogTitle>
                            <DialogDescription>The AI will use the description to decide when to use this tool.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Function Name (Internal)</Label>
                                    <Input placeholder="e.g. send_menu" value={name} onChange={e => setName(e.target.value.replace(/\s+/g, '_').toLowerCase())} />
                                    <p className="text-[10px] text-muted-foreground">Unique identifier (a-z, _).</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>File Type</Label>
                                    <Select value={mediaType} onValueChange={setMediaType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="document">Document (PDF)</SelectItem>
                                            <SelectItem value="audio">Audio</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description (Prompt Trigger) <span className="text-red-500">*</span></Label>
                                <Textarea 
                                    placeholder="Ex: Sends the restaurant menu PDF when the user asks for food options." 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Upload File</Label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />}
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {fileName ? fileName : "Click to upload asset"}
                                            </p>
                                        </div>
                                        <input type="file" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Caption (Optional)</Label>
                                <Input placeholder="Ex: Here is our delicious menu 🍕" value={caption} onChange={e => setCaption(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>AI Confirmation Message (Optional)</Label>
                                <Input placeholder="Ex: I just sent the menu to you!" value={confirmationMessage} onChange={e => setConfirmationMessage(e.target.value)} />
                                <p className="text-[10px] text-muted-foreground">What the AI should say/think after sending successfully.</p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || isUploading || !mediaUrl}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Create Tool'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Function</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tools?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">No tools created yet.</TableCell></TableRow>
                    ) : (
                        tools?.map((tool) => (
                            <TableRow key={tool.id}>
                                <TableCell className="font-mono text-xs">{tool.name}</TableCell>
                                <TableCell>
                                    {tool.mediaType === 'image' && <ImageIcon className="h-4 w-4 text-blue-500" />}
                                    {tool.mediaType === 'document' && <FileText className="h-4 w-4 text-orange-500" />}
                                    {tool.mediaType === 'audio' && <Mic className="h-4 w-4 text-purple-500" />}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" title={tool.description}>{tool.description}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tool.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}