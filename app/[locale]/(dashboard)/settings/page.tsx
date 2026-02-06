'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { useActionState, useState } from 'react';
import { TeamDataWithMembers, User, Invitation } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember, revokeInvitation, resendInvitation } from '@/app/[locale]/(login)/actions';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  PlusCircle, 
  X, 
  Mail, 
  Link as LinkIcon, 
  Check, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  CreditCard,
  Clock 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionState } from '@/lib/auth/middleware';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionSkeleton() {
  const t = useTranslations('Settings');
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>{t('subscription_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="h-4 w-3/4 bg-muted rounded"></div>
          <div className="h-3 w-1/2 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ManageSubscription() {
  const t = useTranslations('Settings');
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);

  const renderPlanStatus = () => {
    if (!teamData) return <span className="text-muted-foreground">{t('loading')}</span>;

    const endDate = teamData.trialEndsAt
      ? new Date(teamData.trialEndsAt).toLocaleDateString()
      : '';

    if (teamData.subscriptionStatus === 'trialing') {
        return (
            <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                        <Clock className="w-3 h-3 mr-1" /> {t('trial_active')}
                    </Badge>
                    {teamData.isCanceled && (
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                            {t('canceled')}
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    {teamData.isCanceled
                        ? `${t('trial_ends', { date: endDate })}`
                        : `${t('trial_ends', { date: endDate })}`}
                </p>
            </div>
        );
    }

    if (teamData.subscriptionStatus === 'active') {
        if (teamData.isCanceled) {
            return (
                <div className="flex flex-col gap-1.5 mt-2">
                    <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                        <AlertTriangle className="w-3 h-3 mr-1" /> {t('canceled')}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                        {endDate}
                    </p>
                </div>
            );
        }
        
        return (
            <div className="flex flex-col gap-1.5 mt-2">
                <Badge className="w-fit bg-green-600 hover:bg-green-700 border-transparent text-white dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> {t('active')}
                </Badge>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 mt-2">
            <Badge variant="outline" className="w-fit text-muted-foreground border-border">
                {t('free_plan')}
            </Badge>
        </div>
    );
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('subscription_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <p className="font-medium text-lg">{t('current_plan')}:</p>
                <span className="text-xl font-bold text-primary">{teamData?.planName || t('free_plan_name')}</span>
              </div>
              
              {renderPlanStatus()}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link href="/pricing" className="w-full sm:w-auto">
                    <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        {teamData?.planName ? t('change_plan_btn') : t('upgrade_btn')}
                    </Button>
                </Link>

                {teamData?.stripeCustomerId && (
                    <form action={customerPortalAction} className="w-full sm:w-auto">
                        <Button type="submit" variant="outline" className="w-full">
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('billing_portal')}
                        </Button>
                    </form>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembersSkeleton() {
  const t = useTranslations('Settings');
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>{t('members_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="flex items-center space-x-4">
            <div className="size-8 rounded-full bg-muted"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-3 w-14 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembers() {
  const t = useTranslations('Settings');
  const { data: teamData, mutate } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || t('unknown_user');
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    
    try {
      const formData = new FormData();
      formData.append('memberId', memberToRemove.toString());
      
      const result: ActionState = await removeTeamMember({}, formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('success_update'));
        mutate(); 
      }
    } catch (error) {
      toast.error(t('failed_to_remove_member_toast')); 
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('members_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('no_members')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('members_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {teamData.teamMembers.map((member, index) => (
              <li key={member.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {getUserDisplayName(member.user).split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getUserDisplayName(member.user)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setMemberToRemove(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertDialogTitle>{t('remove_dialog_title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>{t('remove_dialog_desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>{t('cancel_btn')}</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault();
                    handleRemoveMember();
                }}
                disabled={isRemoving}
                className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('confirm_remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PendingInvitationsSkeleton() {
    const t = useTranslations('Settings');
    return (
      <Card className="mb-8 h-[140px]">
        <CardHeader>
          <CardTitle>{t('invites_title')}</CardTitle>
        </CardHeader>
      </Card>
    );
}

function PendingInvitationItem({ invite, mutate }: { invite: Invitation, mutate: () => void }) {
    const t = useTranslations('Settings');
    const [isRevoking, setIsRevoking] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/sign-up?inviteId=${invite.id}`;
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        toast.success(t('link_copied_toast')); 
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const formData = new FormData();
            formData.append('inviteId', invite.id.toString());
            const res: ActionState = await resendInvitation({}, formData);
            if (res.error) toast.error(res.error);
            else toast.success(t('invitation_resent_toast')); 
        } catch (e) {
            toast.error(t('failed_to_resend_toast')); 
        } finally {
            setIsResending(false);
        }
    };

    const handleRevoke = async () => {
        setIsRevoking(true);
        try {
            const formData = new FormData();
            formData.append('inviteId', invite.id.toString());
            const res: ActionState = await revokeInvitation({}, formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(t('revoked_toast')); 
                mutate();
            }
        } catch (e) {
            toast.error(t('failed_to_revoke_toast')); 
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <li className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
            <div className="flex items-center space-x-4">
                <div className="bg-orange-200 dark:bg-orange-900 p-2 rounded-full">
                    <Mail className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                </div>
                <div>
                    <p className="font-medium text-sm">{invite.email}</p>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 px-1 py-0 h-5">
                            {invite.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {t('invite_sent', { date: new Date(invite.invitedAt).toLocaleDateString() })}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleCopyLink}>
                                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('copy_link')}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleResend} disabled={isResending}>
                                {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('resend_email_tooltip')}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleRevoke} disabled={isRevoking}>
                                {isRevoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('revoke')}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </li>
    );
}

function PendingInvitations() {
    const t = useTranslations('Settings');
    const { data: invitations, mutate } = useSWR<Invitation[]>('/api/invitations', fetcher);

    if (!invitations || invitations.length === 0) return null;

    return (
        <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950/10 dark:border-orange-900">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-orange-700 dark:text-orange-400">{t('invites_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {invitations.map((invite) => (
                        <PendingInvitationItem key={invite.id} invite={invite} mutate={mutate} />
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function InviteTeamMemberSkeleton() {
  const t = useTranslations('Settings');
  return (
    <Card className="h-[260px]">
      <CardHeader>
        <CardTitle>{t('invite_section_title')}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InviteTeamMember() {
  const t = useTranslations('Settings');
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { mutate } = useSWR('/api/invitations');
  const isOwner = user?.role === 'owner';
  
  const [inviteState, inviteAction, isInvitePending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
        const result: ActionState = await inviteTeamMember(prevState, formData);
        if (result.success) {
            toast.success(t('invitation_sent_toast')); 
            mutate();
        } else if (result.error) {
            toast.error(result.error);
        }
        return result;
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('invite_section_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">
              {t('email_label')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              required
              disabled={!isOwner}
            />
          </div>
          <div>
            <Label>{t('role_label')}</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">{t('role_member')}</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">{t('role_owner')}</Label>
              </div>
            </RadioGroup>
          </div>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isInvitePending || !isOwner}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('inviting')}
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('invite_btn')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {t('owner_only')}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const t = useTranslations('Settings');
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">{t('team_title')}</h1>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      
      <Suspense fallback={<PendingInvitationsSkeleton />}>
        <PendingInvitations />
      </Suspense>

      <Suspense fallback={<TeamMembersSkeleton />}>
        <TeamMembers />
      </Suspense>
      <Suspense fallback={<InviteTeamMemberSkeleton />}>
        <InviteTeamMember />
      </Suspense>
    </section>
  );
}