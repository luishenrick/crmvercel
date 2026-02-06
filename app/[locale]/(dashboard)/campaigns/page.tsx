'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Plus, Megaphone, Calendar, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CampaignsPage() {
    const t = useTranslations('Campaigns');
    const { data: campaigns, isLoading, mutate } = useSWR('/api/campaigns/list', fetcher);
    const { data: featureData, isLoading: isFeatureLoading } = useSWR('/api/features?name=isCampaignsEnabled', fetcher);

    const handleStart = async (id: number) => {
        toast.promise(
            fetch('/api/campaigns/send', {
                method: 'POST',
                body: JSON.stringify({ campaignId: id })
            }).then(async r => {
                if(!r.ok) throw new Error();
                mutate();
            }),
            {
                loading: t('toasts.dispatching'),
                success: t('toasts.finished'),
                error: t('toasts.error')
            }
        );
    };

    return (
        <div className="flex flex-col h-full bg-muted p-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>
                {featureData?.hasAccess && (
                    <Link href="/campaigns/new">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="h-4 w-4 mr-2" /> {t('create_btn')}
                        </Button>
                    </Link>
                )}
            </header>

            {isLoading ? (
                <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (!campaigns || campaigns.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-96 bg-background rounded-xl border border-border">
                    <Megaphone className="h-16 w-16 text-muted mb-4" />
                    <h3 className="text-lg font-medium text-foreground">{t('empty_title')}</h3>
                    <p className="text-muted-foreground mb-6">{t('empty_desc')}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {campaigns?.map((camp: any) => (
                        <div key={camp.id} className="bg-background p-6 rounded-xl border border-border flex justify-between items-center">
                             <Link key={camp.id} href={`/campaigns/${camp.id}`} className="block">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold text-foreground">{camp.name}</h3>
                                    <Badge variant={camp.status === 'COMPLETED' ? 'default' : 'outline'}>{camp.status}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex gap-4">
                                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(camp.createdAt).toLocaleDateString()}</span>
                                    <span>{t('stats_total', {count: camp.totalLeads})}</span>
                                    <span className="text-primary">{t('stats_sent', {count: camp.sentCount})}</span>
                                    <span className="text-destructive">{t('stats_failed', {count: camp.failedCount})}</span>
                                </div>
                            </div>
                            </Link>
                                <div>
                                {camp.status === 'DRAFT' && (
                                    <Button size="sm" onClick={() => handleStart(camp.id)}>
                                        <Play className="h-4 w-4 mr-2" /> {t('start_btn')}
                                    </Button>
                                )}
                            </div>
                        </div>

                    ))}
                </div>
            )}
        </div>
    );
}