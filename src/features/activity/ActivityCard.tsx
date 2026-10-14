import {
  ExternalLink,
  FileText,
  Hash,
  Image,
  MessageSquare,
  Repeat2,
  Users,
  UserPlus,
  Building2,
  CalendarDays,
  ArrowRightFromLine,
  ArrowLeftToLine,
  Quote,
  BriefcaseBusiness,
  Megaphone,
  Bookmark,
  Star,
  Mail,
  Shield,
  Search,
  GraduationCap,
  CreditCard,
  Vote,
} from 'lucide-react';
import { linkedInHashtagSearchUrl } from '../../lib/linkedin/search';
import { ExternalLinkText } from '../../components/ExternalLinkText';
import { PersonRow } from '../../components/PersonRow';
import { CompanyRow } from '../../components/CompanyRow';
import { InvitationRow } from '../../components/InvitationRow';
// Use explicit arrow icons for invitations
import { formatTemporal } from '../../lib/datetime';
import type { ActivityItem } from '../profile/model';
import { displayText, titleCase } from '../profile/model';
import type { ReactNode } from 'react';
import { InitialsAvatar } from '../../components/InitialsAvatar';
import { RelativeTimeText } from '../../components/RelativeTimeText';
import { ReactionIcon } from './ReactionIcon';
import { linkedInProfileSectionUrl, type LinkedInProfileInfo } from '../../lib/linkedin/profile';
import { ipGeolocationUrl } from '../../lib/ip-geolocation';

interface ActivityCardProps {
  activity: ActivityItem;
  profileName: string;
  compact?: boolean;
  linkedInProfile?: LinkedInProfileInfo;
}

export function ActivityCard({
  activity,
  profileName,
  compact = false,
  linkedInProfile,
}: ActivityCardProps) {
  const body = displayText(activity.text);

  if (activity.kind === 'vote') {
    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Vote className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">
                <ExternalLinkText href={activity.href}>
                  {body || 'Voted in a poll'}
                </ExternalLinkText>
              </h3>
              <span className="badge badge-xs badge-warning">Vote</span>
            </div>
            <p className="text-xs opacity-70">
              <RelativeTimeText value={parseActivityDate(activity)} />
            </p>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'reaction') {
    const reactionBody = body;
    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <ReactionIcon type={activity.reactionType} className="h-8 w-8 text-3xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">
                <ExternalLinkText href={activity.href}>
                  {reactionBody || 'Reacted to a post'}
                </ExternalLinkText>
              </h3>
              <span className="badge badge-xs badge-warning">Reaction</span>
            </div>
            <p className="text-xs opacity-70">
              <RelativeTimeText value={parseActivityDate(activity)} />
            </p>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'event') {
    const eventName = activity.text || 'LinkedIn event';
    const statusSummary = activity.status ? eventStatusSummary(activity.status) : '';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <CalendarDays className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{eventName}</h3>
                  <span className="badge badge-xs badge-info">Event</span>
                </div>
                {statusSummary ? <p className="text-sm opacity-70">{statusSummary}</p> : null}
                <p className="text-xs opacity-70">
                  <RelativeTimeText
                    value={parseActivityDate(activity)}
                    prefix={isFutureTemporal(activity.dateTemporal) ? 'Starts' : 'Started'}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Render person-like activities using the shared rows
  if (
    activity.kind === 'connection' ||
    activity.kind === 'member-follow' ||
    activity.kind === 'person-mute' ||
    activity.kind === 'person-unfollow'
  ) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <PersonRow
          name={activity.targetName ?? profileName}
          href={activity.href ?? ''}
          primaryLine={undefined}
          secondaryLine={undefined}
          timePrefix={activity.eyebrow}
          dateTemporal={activity.dateTemporal}
          date={activity.date}
          showSearch={activity.kind === 'member-follow'}
          searchCategory={'people'}
          avatarClassName={'bg-base-300 text-base-content ring-1 ring-base-300'}
          badge={
            activity.kind === 'connection' ? (
              <span className="badge badge-xs badge-success">Established</span>
            ) : activity.kind === 'person-unfollow' ? (
              <span className="badge badge-xs badge-ghost">Unfollowed</span>
            ) : activity.kind === 'person-mute' ? (
              <span className="badge badge-xs badge-warning">Muted</span>
            ) : (
              <span className="badge badge-xs badge-success">Following</span>
            )
          }
        />
      </div>
    );
  }

  if (activity.kind === 'company-follow') {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <CompanyRow
          name={activity.targetName ?? profileName}
          href={activity.href ?? ''}
          timePrefix={activity.eyebrow}
          dateTemporal={activity.dateTemporal}
          date={activity.date}
          showSearch={true}
          badge={<span className="badge badge-xs badge-success">Company</span>}
        />
      </div>
    );
  }

  if (activity.kind === 'invitation-sent' || activity.kind === 'invitation-received') {
    const isReceived = activity.kind === 'invitation-received';
    return (
      <div className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <InvitationRow
          name={activity.targetName ?? profileName}
          href={activity.href ?? ''}
          message={''}
          dateTemporal={activity.dateTemporal}
          date={activity.date}
          direction={isReceived ? 'incoming' : 'outgoing'}
          badge={
            <span className="badge badge-xs badge-warning">{isReceived ? 'Received' : 'Sent'}</span>
          }
        />
      </div>
    );
  }

  if (activity.kind === 'recommendation-given' || activity.kind === 'recommendation-received') {
    const name = activity.targetName ?? 'LinkedIn member';
    const given = activity.kind === 'recommendation-given';
    const recsUrl = linkedInProfileSectionUrl(linkedInProfile, 'recommendations');
    const tabIndex = activity.status === 'PENDING' ? 2 : given ? 1 : 0;
    const recHref = recsUrl ? `${recsUrl}?detailScreenTabIndex=${tabIndex}` : undefined;

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <InitialsAvatar
            name={name}
            size="md"
            className="bg-base-300 text-base-content ring-1 ring-base-300"
          />
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold">
                  <ExternalLinkText href={recHref}>{name}</ExternalLinkText>
                  {!recHref && name}
                </h3>
                <span className={`badge badge-xs ${given ? 'badge-secondary' : 'badge-accent'}`}>
                  {given ? 'Given' : 'Received'}
                </span>
                {activity.status ? (
                  <span
                    className={`badge badge-xs ${activity.status === 'VISIBLE' ? 'badge-success' : activity.status === 'PENDING' ? 'badge-warning' : 'badge-ghost'}`}
                  >
                    {titleCase(activity.status)}
                  </span>
                ) : null}
              </div>
              {activity.headline ? <p className="text-sm opacity-70">{activity.headline}</p> : null}
              <p className="mt-1 text-xs opacity-70">
                {activity.eyebrow} · {formatDate(activity)}
              </p>
            </div>

            {body ? (
              <p className="mt-3 flex gap-2 whitespace-pre-line text-sm leading-relaxed">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{body}</span>
              </p>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'hashtag-follow') {
    const tag = activity.targetName || activity.text || '';
    // normalize to raw tag without leading '#'
    const raw = tag.startsWith('#') ? tag.slice(1) : tag;
    const href = linkedInHashtagSearchUrl(raw ? `#${raw}` : raw);

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Hash className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={href}>#{raw}</ExternalLinkText>
                    {!href && `#${raw}`}
                  </h3>
                  <span className="badge badge-xs badge-accent">Hashtag</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'search') {
    const term = searchTerm(activity.text);

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Search className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={linkedInSearchUrl(term)}>{term}</ExternalLinkText>
                  </h3>
                  <span className="badge badge-xs badge-secondary">Search</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'ad') {
    const adId = adIdentifier(activity.text);

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Megaphone className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={`https://www.linkedin.com/ad-library/detail/${adId}`}>
                      {adId}
                    </ExternalLinkText>
                  </h3>
                  <span className="badge badge-xs badge-error">Ad</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'account-receipt') {
    const description = activity.text || 'Receipt';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <CreditCard className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href="https://www.linkedin.com/manage/purchases-payments/transactions">
                      {description}
                    </ExternalLinkText>
                  </h3>
                  <span className="badge badge-xs badge-accent">Receipt</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {formatReceiptAmounts(activity)}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'account-email-update') {
    const email = emailAddress(activity.text);

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Mail className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{email}</h3>
                  <span className="badge badge-xs badge-info">Email</span>
                  {activity.status
                    ? activity.status.split(' · ').map((tag) => (
                        <span
                          key={tag}
                          className={`badge badge-xs ${tag === 'primary' ? 'badge-success' : 'badge-ghost badge-success'}`}
                        >
                          {tag}
                        </span>
                      ))
                    : null}
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'security-challenge') {
    const ipDisplay =
      activity.challengeIp || activity.targetName || activity.text || 'Security challenge';
    const country =
      activity.text && activity.text !== (activity.targetName || activity.text)
        ? activity.text
        : '';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Shield className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold tabular-nums">
                    {ipDisplay}
                    {activity.challengeIp ? (
                      <>
                        {' '}
                        <a
                          href={ipGeolocationUrl(activity.challengeIp)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center align-middle hover:text-primary"
                          title={`Look up IP ${activity.challengeIp}`}
                          aria-label={`Look up IP ${activity.challengeIp} on ipgeolocation.io`}
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </>
                    ) : null}
                  </h3>
                  <span className="badge badge-xs badge-error">Challenge</span>
                  {country ? <span className="badge badge-ghost badge-xs">{country}</span> : null}
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {activity.challengeUserAgent ? (
                  <p className="mt-1 text-xs break-all">{activity.challengeUserAgent}</p>
                ) : null}
                {activity.targetName ? (
                  <p className="mt-1 text-xs">
                    <span className="font-semibold">Type:</span> {activity.targetName}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'security-login') {
    const ipDisplay = activity.loginIp || activity.targetName || 'Login';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Shield className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold tabular-nums">
                    {ipDisplay}
                    {activity.loginIp ? (
                      <>
                        {' '}
                        <a
                          href={ipGeolocationUrl(activity.loginIp)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center align-middle hover:text-primary"
                          title={`Look up IP ${activity.loginIp}`}
                          aria-label={`Look up IP ${activity.loginIp} on ipgeolocation.io`}
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </>
                    ) : null}
                  </h3>
                  <span className="badge badge-xs badge-success">Login</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {activity.loginUserAgent ? (
                  <p className="mt-1 text-xs break-all">{activity.loginUserAgent}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'security-verification') {
    const verificationType = activity.targetName || 'Verification';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Shield className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{verificationType}</h3>
                  <span className="badge badge-xs badge-warning">Verification</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {activity.verificationDetails ? (
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                    {Object.entries(activity.verificationDetails).flatMap(([key, value]) => [
                      <dt key={`dt-${key}`} className="opacity-60">
                        {key}
                      </dt>,
                      <dd key={`dd-${key}`} className="truncate">
                        {value}
                      </dd>,
                    ])}
                  </dl>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'job-saved') {
    const jobTitle = jobTitleFromText(activity.text);
    const company = activity.targetName;

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <BriefcaseBusiness className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={activity.href}>{jobTitle}</ExternalLinkText>
                    {!activity.href && jobTitle}
                  </h3>
                  <span className="badge badge-xs badge-accent">Saved</span>
                  {company ? <span className="badge badge-ghost badge-xs">{company}</span> : null}
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'job-applied') {
    const jobTitle = jobTitleFromText(activity.text);
    const company = activity.targetName;

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <BriefcaseBusiness className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={activity.href}>{jobTitle}</ExternalLinkText>
                    {!activity.href && jobTitle}
                  </h3>
                  <span className="badge badge-xs badge-warning">Applied</span>
                  {company ? <span className="badge badge-ghost badge-xs">{company}</span> : null}
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'endorsement-given' || activity.subtype === 'endorsement-received') {
    const name = activity.targetName || 'LinkedIn member';
    const skill = skillFromEndorsement(activity.text) || 'Endorsement';
    const sent = activity.subtype === 'endorsement-given';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Star className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{skill}</h3>
                  <span className={`badge badge-xs ${sent ? 'badge-secondary' : 'badge-accent'}`}>
                    {sent ? 'Given' : 'Received'}
                  </span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {name ? (
                  <p className="mt-1 text-xs">
                    <ExternalLinkText href={activity.href}>{name}</ExternalLinkText>
                    {!activity.href && name}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'learning') {
    const courseTitle = activity.targetName || learningCourseTitle(activity.text);

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <GraduationCap className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href="https://www.linkedin.com/learning/me/my-library/">
                      {courseTitle}
                    </ExternalLinkText>
                  </h3>
                  <span className="badge badge-xs badge-success">Learning</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {activity.learningDescription ? (
                  <div
                    className="mt-2 text-xs space-y-2"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(activity.learningDescription),
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'rich-media') {
    const title = activity.text || 'Media';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Image className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={activity.href}>{title}</ExternalLinkText>
                    {!activity.href && title}
                  </h3>
                  <span className="badge badge-xs badge-info">Media</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'saved-item') {
    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Bookmark className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={activity.href}>Saved item</ExternalLinkText>
                    {!activity.href && 'Saved item'}
                  </h3>
                  <span className="badge badge-xs badge-accent">Saved</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'comment') {
    const commentBody = displayText(activity.text);

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <MessageSquare className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={activity.href}>Comment</ExternalLinkText>
                    {!activity.href && 'Comment'}
                  </h3>
                  <span className="badge badge-xs badge-warning">Comment</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {commentBody ? (
                  <p className="mt-1 whitespace-pre-line text-xs">{commentBody}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'message-sent' || activity.subtype === 'message-received') {
    const name = activity.targetName || 'LinkedIn member';
    const sent = activity.subtype === 'message-sent';
    const messageBody = messageContent(activity.text, name);

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Mail className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={activity.href}>{name}</ExternalLinkText>
                    {!activity.href && name}
                  </h3>
                  <span className={`badge badge-xs ${sent ? 'badge-secondary' : 'badge-accent'}`}>
                    {sent ? 'Sent' : 'Received'}
                  </span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {messageBody ? (
                  <p className="mt-1 whitespace-pre-line text-xs">{messageBody}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.kind === 'repost') {
    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Repeat2 className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    <ExternalLinkText href={activity.href}>Repost</ExternalLinkText>
                    {!activity.href && 'Repost'}
                  </h3>
                  <span className="badge badge-xs badge-warning">Repost</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'connection-imported') {
    const name =
      activity.targetName ||
      (activity.text || '').replace(/^Imported contact /, '').trim() ||
      'Imported contact';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <InitialsAvatar name={name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{name}</h3>
                  <span className="badge badge-error badge-xs">Imported</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
                {activity.importedContactDetails ? (
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                    {Object.entries(activity.importedContactDetails).flatMap(([key, value]) => [
                      <dt key={`dt-${key}`} className="opacity-60">
                        {key}
                      </dt>,
                      <dd key={`dd-${key}`} className="truncate">
                        {value}
                      </dd>,
                    ])}
                  </dl>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (activity.subtype === 'account-registration') {
    const ipDisplay = activity.registrationIp || 'Registered LinkedIn account';

    return (
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
        <div className="flex gap-3 p-4">
          <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content h-12 w-12">
            <Star className="h-5 w-5 opacity-70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold tabular-nums">
                    {ipDisplay}
                    {activity.registrationIp ? (
                      <>
                        {' '}
                        <a
                          href={ipGeolocationUrl(activity.registrationIp)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center align-middle hover:text-primary"
                          title={`Look up IP ${activity.registrationIp}`}
                          aria-label={`Look up IP ${activity.registrationIp} on ipgeolocation.io`}
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </>
                    ) : null}
                  </h3>
                  <span className="badge badge-xs badge-info">Account created</span>
                </div>
                <p className="text-xs opacity-70">
                  <RelativeTimeText value={parseActivityDate(activity)} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Fallback rendering for other activity kinds (post, comment, repost, etc.)
  return (
    <article className="rounded-box border border-base-300 bg-base-100 shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        <InitialsAvatar name={profileName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">
                <ExternalLinkText href={activity.href}>{profileName}</ExternalLinkText>
                {!activity.href && profileName}
              </h3>
              <p className="flex items-center gap-1 text-xs opacity-70">
                {iconFor(activity)}
                {activity.eyebrow} · {formatDate(activity)}
              </p>
            </div>
          </div>
          {body && (
            <p
              className={`mt-3 whitespace-pre-line wrap-break-word text-sm leading-relaxed ${
                compact ? 'line-clamp-5' : ''
              }`}
            >
              {body}
            </p>
          )}
          {activity.mediaUrl && (
            <a
              className="mt-3 block rounded-box border border-base-300 bg-base-200 p-3 text-sm hover:border-primary/50"
              href={activity.mediaUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="font-semibold">{host(activity.mediaUrl)}</span>
              <span className="block truncate opacity-70">{activity.mediaUrl}</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function iconFor(activity: ActivityItem) {
  if (activity.kind === 'vote') return <Vote className="h-3.5 w-3.5" />;
  if (activity.kind === 'comment') return <MessageSquare className="h-3.5 w-3.5" />;
  if (activity.kind === 'repost') return <Repeat2 className="h-3.5 w-3.5" />;
  if (activity.kind === 'job') return <BriefcaseBusiness className="h-3.5 w-3.5" />;
  if (activity.kind === 'ad') return <Megaphone className="h-3.5 w-3.5" />;
  if (activity.kind === 'saved-item') return <Bookmark className="h-3.5 w-3.5" />;
  if (activity.kind === 'endorsement') return <Star className="h-3.5 w-3.5" />;
  if (activity.kind === 'account') return <Mail className="h-3.5 w-3.5" />;
  if (activity.kind === 'security') return <Shield className="h-3.5 w-3.5" />;
  if (activity.kind === 'search') return <Search className="h-3.5 w-3.5" />;
  if (activity.kind === 'message') return <Mail className="h-3.5 w-3.5" />;
  if (activity.kind === 'learning') return <GraduationCap className="h-3.5 w-3.5" />;
  if (activity.kind === 'connection') return <Users className="h-3.5 w-3.5" />;
  if (activity.kind === 'member-follow') return <UserPlus className="h-3.5 w-3.5" />;
  if (activity.kind === 'company-follow') return <Building2 className="h-3.5 w-3.5" />;
  if (activity.kind === 'recommendation-given') return <Quote className="h-3.5 w-3.5" />;
  if (activity.kind === 'recommendation-received') return <Quote className="h-3.5 w-3.5" />;
  if (activity.kind === 'invitation-sent') return <ArrowRightFromLine className="h-3.5 w-3.5" />;
  if (activity.kind === 'invitation-received') return <ArrowLeftToLine className="h-3.5 w-3.5" />;
  if (activity.kind === 'event') return <CalendarDays className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function formatDate(activity: ActivityItem): string {
  if (activity.dateTemporal) return formatTemporal(activity.dateTemporal, activity.date);
  const timestamp = Date.parse(activity.date);
  if (Number.isNaN(timestamp)) return activity.date;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp);
}

function host(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return 'Linked resource';
  }
}

function eventStatusSummary(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (!normalized) return '';
  return `${eventStatusSymbol(normalized)} ${titleCase(normalized)}`;
}

function eventStatusSymbol(status: string): string {
  if (status === 'APPROVED') return '✓';
  if (status === 'RELINQUISHED') return '↩';
  if (status === 'DECLINED') return '✕';
  if (status === 'ATTENDED') return '★';
  if (status === 'WAITLISTED') return '⏳';
  if (status === 'CANCELLED' || status === 'CANCELED') return '⚠';
  if (status === 'REGISTERED') return '•';
  return '•';
}

function isFutureTemporal(temporal: { epochMs?: number } | undefined): boolean {
  return typeof temporal?.epochMs === 'number' && temporal.epochMs > Date.now();
}

function linkedInSearchUrl(query: string): string {
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`;
}

const ALLOWED_TAGS = new Set([
  'i',
  'em',
  'b',
  'strong',
  'u',
  's',
  'mark',
  'small',
  'sub',
  'sup',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'a',
  'span',
  'div',
  'blockquote',
  'code',
  'pre',
]);

function sanitizeHtml(raw: string): string {
  if (!/<[^>]+>/.test(raw)) return escapeHtml(raw);
  let result = raw;
  result = result.replace(/<\/?\w[^>]*>/gi, (tag) => {
    const match = tag.match(/^<\/?(\w+)/);
    const tagName = match?.[1]?.toLowerCase();
    if (!tagName || !ALLOWED_TAGS.has(tagName)) return '';
    if (tagName === 'br' || tagName === 'hr') return `<${tagName} />`;
    if (tag.startsWith('</')) return tag;
    const cleaned = tag
      .replace(/(on\w+)=/gi, 'data-sanitized=')
      .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
    if (tagName === 'a') return cleaned;
    return `<${tagName}>`;
  });
  return result;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function adIdentifier(text: string): string {
  const withoutPrefix = text.replace(/^Clicked\s+ad\s+/i, '');
  return withoutPrefix.trim() || text;
}

function jobTitleFromText(text: string): string {
  // text format: "Applied to TITLE at COMPANY" or "Saved job: TITLE at COMPANY"
  const afterPrefix = text.replace(/^(Applied to|Saved job:)\s+/i, '').trim();
  const atIdx = afterPrefix.lastIndexOf(' at ');
  return atIdx !== -1 ? afterPrefix.slice(0, atIdx).trim() : afterPrefix;
}

function skillFromEndorsement(text: string): string | undefined {
  // text format: "Endorsed NAME for SKILL" or "Received endorsement for SKILL from NAME"
  const match = text.match(/(?:Endorsed .+? for |Received endorsement for )(.+?)(?: from .+)?$/i);
  return match?.[1]?.trim() || undefined;
}

function messageContent(text: string, counterpart: string): string {
  // text format: "To X: body" or "X: body"
  const sentPrefix = `To ${counterpart}:`;
  if (text.startsWith(sentPrefix)) return text.slice(sentPrefix.length).trim();
  const recvPrefix = `${counterpart}:`;
  if (text.startsWith(recvPrefix)) return text.slice(recvPrefix.length).trim();
  return text;
}

function formatReceiptAmounts(activity: ActivityItem): ReactNode {
  const sub = activity.receiptSubTotal;
  const tax = activity.receiptTaxAmount;
  const total = activity.receiptTotalAmount;
  const currency = activity.receiptCurrency ?? '';
  if (!sub && !tax && !total) return null;
  const fmt = (v: string) => `${v} ${currency}`.trim();
  const span = (label: string, value: string) => (
    <span title={label} className="cursor-default">
      {fmt(value)}
    </span>
  );
  const parts: ReactNode[] = [];
  if (sub) parts.push(span('Sub Total', sub));
  if (tax) parts.push(span('Tax Amount', tax));
  if (total) parts.push(span('Total Amount', total));
  if (parts.length === 1) return <span className="tabular-nums">{parts[0]}</span>;
  return (
    <span className="tabular-nums">
      {parts[0]} + {parts[1]} = {parts[2]}
    </span>
  );
}

function searchTerm(text: string): string {
  const withoutPrefix = text.replace(/^Searched for\s+/, '');
  let term = withoutPrefix.trim();
  if (
    (term.startsWith('"') && term.endsWith('"')) ||
    (term.startsWith('\u201C') && term.endsWith('\u201D'))
  ) {
    term = term.slice(1, -1);
  }
  return term || text;
}

function parseActivityDate(activity: ActivityItem): Date | number | string {
  if (activity.dateTemporal?.epochMs) return activity.dateTemporal.epochMs;
  const timestamp = Date.parse(activity.date);
  return Number.isNaN(timestamp) ? activity.date : timestamp;
}

function learningCourseTitle(text: string): string {
  // text format: "Viewed course: Title" or "Completed course: Title"
  const colon = text.indexOf(':');
  return colon !== -1 ? text.slice(colon + 1).trim() : text;
}

function emailAddress(text: string): string {
  // text format: "Updated email address: first.last@mail.com"
  const colon = text.indexOf(':');
  return colon !== -1 ? text.slice(colon + 1).trim() : text;
}
