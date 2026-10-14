import { formatTemporal, parseTemporalValue, type NormalizedTemporal } from '../../lib/datetime';
import type { DatasetMeta, DatasetRow, ImportMeta } from '../../lib/store';

export type ActivityKind =
  | 'post'
  | 'comment'
  | 'reaction'
  | 'repost'
  | 'rich-media'
  | 'job'
  | 'ad'
  | 'saved-item'
  | 'endorsement'
  | 'account'
  | 'security'
  | 'search'
  | 'message'
  | 'learning'
  | 'connection'
  | 'member-follow'
  | 'person-mute'
  | 'person-unfollow'
  | 'company-follow'
  | 'hashtag-follow'
  | 'recommendation-given'
  | 'recommendation-received'
  | 'invitation-sent'
  | 'invitation-received'
  | 'event'
  | 'vote';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  date: string;
  dateTemporal?: NormalizedTemporal;
  subtype?:
    | 'job-applied'
    | 'job-saved'
    | 'endorsement-given'
    | 'endorsement-received'
    | 'account-email-update'
    | 'account-registration'
    | 'connection-imported'
    | 'account-receipt'
    | 'message-sent'
    | 'message-received'
    | 'security-verification'
    | 'security-login'
    | 'security-challenge';
  href?: string;
  targetName?: string;
  headline?: string;
  text: string;
  eyebrow: string;
  status?: string;
  mediaUrl?: string;
  reactionType?: string;
  receiptSubTotal?: string;
  receiptTaxAmount?: string;
  receiptTotalAmount?: string;
  receiptCurrency?: string;
  learningDescription?: string;
  challengeIp?: string;
  challengeUserAgent?: string;
  loginIp?: string;
  loginUserAgent?: string;
  registrationIp?: string;
  verificationDetails?: Record<string, string>;
  importedContactDetails?: Record<string, string>;
}

export interface WebsiteLink {
  label: string;
  href: string;
}

export function text(row: DatasetRow | undefined, key: string): string {
  const value = row?.[key];
  return typeof value === 'string' ? value.trim() : value === undefined ? '' : String(value);
}

export function formatRowTemporal(row: DatasetRow | undefined, key: string): string {
  const raw = text(row, key);
  if (!raw) return '';
  return formatTemporal(row?.__dates?.[key] ?? parseTemporalValue(raw), raw);
}

export function displayText(value: string): string {
  const trimmed = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!trimmed) return '';

  return stripOuterQuotes(trimmed)
    .split('\n')
    .map((line) => stripOuterQuotes(line.trimEnd()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function fullName(profile: DatasetRow | undefined): string {
  const name = [text(profile, 'First Name'), text(profile, 'Last Name')].filter(Boolean).join(' ');
  return name || 'LinkedIn Member';
}

export function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LI';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts.at(-1)![0]}`.toUpperCase();
}

export function parseWebsites(value: string): WebsiteLink[] {
  const normalized = value.trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!normalized) return [];

  const matches = [...normalized.matchAll(/([^,[\]]+?):(https?:\/\/[^,\]]+)/gi)].map((match) => ({
    label: titleCase(match[1]?.trim() || 'Website'),
    href: match[2]?.trim() || '',
  }));

  if (matches.length > 0) return matches.filter((link) => link.href.startsWith('http'));

  return normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf(':');
      if (separator === -1) return { label: 'Website', href: part };
      return {
        label: titleCase(part.slice(0, separator)),
        href: part.slice(separator + 1).trim(),
      };
    })
    .filter((link) => link.href.startsWith('http'));
}

export function datasetFor(importMeta: ImportMeta, schemaId: string): DatasetMeta | undefined {
  return importMeta.datasets.find((dataset) => dataset.schemaId === schemaId);
}

export function dateTime(value: string): number {
  const clean = value.trim();
  if (!clean) return Number.NEGATIVE_INFINITY;

  const direct = Date.parse(clean.replace(/ UTC$/, ' GMT'));
  if (!Number.isNaN(direct)) return direct;

  const monthYear = clean.match(/^([A-Za-z]{3,})\s+(\d{4})$/);
  if (monthYear) {
    const parsed = Date.parse(`${monthYear[1]} 1, ${monthYear[2]}`);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  }

  const year = clean.match(/^\d{4}$/);
  if (year) return Date.parse(`${clean}-01-01T00:00:00Z`);

  return Number.NEGATIVE_INFINITY;
}

export function sortByDateDesc<T extends DatasetRow>(rows: T[], key: string): T[] {
  return [...rows].sort((a, b) => rowDateTime(b, key) - rowDateTime(a, key));
}

export function sortPositions(rows: DatasetRow[]): DatasetRow[] {
  return [...rows].sort((a, b) => {
    const aCurrent = text(a, 'Finished On') ? 0 : 1;
    const bCurrent = text(b, 'Finished On') ? 0 : 1;
    if (aCurrent !== bCurrent) return bCurrent - aCurrent;
    return rowDateTime(b, 'Started On') - rowDateTime(a, 'Started On');
  });
}

export function formatRange(start: string, end: string): string {
  if (!start && !end) return '';
  if (!end) return `${start} - Present`;
  if (!start) return end;
  return `${start} - ${end}`;
}

export function endorsementCounts(rows: DatasetRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const skill = text(row, 'Skill Name');
    if (skill) counts.set(skill, (counts.get(skill) ?? 0) + 1);
  }
  return counts;
}

export function makeActivities(input: {
  ownerName?: string;
  shares: DatasetRow[];
  richMedia: DatasetRow[];
  comments: DatasetRow[];
  reactions: DatasetRow[];
  votes: DatasetRow[];
  reposts: DatasetRow[];
  jobApplications?: DatasetRow[];
  savedJobs?: DatasetRow[];
  adsClicked?: DatasetRow[];
  savedItems?: DatasetRow[];
  endorsementsGiven?: DatasetRow[];
  endorsementsReceived?: DatasetRow[];
  emailAddresses?: DatasetRow[];
  registration?: DatasetRow[];
  importedContacts?: DatasetRow[];
  verifications?: DatasetRow[];
  logins?: DatasetRow[];
  securityChallenges?: DatasetRow[];
  searchQueries?: DatasetRow[];
  receipts?: DatasetRow[];
  messages?: DatasetRow[];
  guideMessages?: DatasetRow[];
  learningCoachMessages?: DatasetRow[];
  learningRolePlayMessages?: DatasetRow[];
  learning?: DatasetRow[];
  recommendationsReceived?: DatasetRow[];
  recommendationsGiven?: DatasetRow[];
  connections?: DatasetRow[];
  invitations?: DatasetRow[];
  memberFollows?: DatasetRow[];
  companyFollows?: DatasetRow[];
  hashtagFollows?: DatasetRow[];
  events?: DatasetRow[];
}): ActivityItem[] {
  const posts = input.shares.map((row) => ({
    id: `post-${row.__row}`,
    kind: 'post' as const,
    date: text(row, 'Date'),
    dateTemporal: row.__dates?.Date,
    href: text(row, 'ShareLink'),
    text: text(row, 'ShareCommentary') || text(row, 'SharedUrl') || 'Shared a post',
    eyebrow: 'Posted',
    mediaUrl: text(row, 'MediaUrl') || text(row, 'SharedUrl'),
  }));
  const richMedia = input.richMedia.map((row) => ({
    id: `rich-media-${row.__row}`,
    kind: 'rich-media' as const,
    date: text(row, 'Date/Time'),
    dateTemporal: row.__dates?.['Date/Time'],
    href: text(row, 'Media Link'),
    text: meaningfulText(row, 'Media Description') || 'Media',
    eyebrow: 'Rich media',
  }));
  const comments = input.comments.map((row) => ({
    id: `comment-${row.__row}`,
    kind: 'comment' as const,
    date: text(row, 'Date'),
    dateTemporal: row.__dates?.Date,
    href: text(row, 'Link'),
    text: text(row, 'Message') || 'Commented on a post',
    eyebrow: 'Commented',
  }));
  const reactions = input.reactions.map((row) => {
    const reactionType = titleCase(text(row, 'Type'));
    return {
      id: `reaction-${row.__row}`,
      kind: 'reaction' as const,
      date: text(row, 'Date'),
      dateTemporal: row.__dates?.Date,
      href: text(row, 'Link'),
      text: reactionType || 'Reacted to a post',
      eyebrow: 'Reacted',
      reactionType,
    };
  });
  const votes = input.votes.map((row) => ({
    id: `vote-${row.__row}`,
    kind: 'vote' as const,
    date: text(row, 'Date'),
    dateTemporal: row.__dates?.Date,
    href: text(row, 'Link'),
    text: voteSummary(text(row, 'OptionText')),
    eyebrow: 'Voted in a poll',
  }));
  const reposts = input.reposts.map((row) => ({
    id: `repost-${row.__row}`,
    kind: 'repost' as const,
    date: text(row, 'Date'),
    dateTemporal: row.__dates?.Date,
    href: text(row, 'Link'),
    text: 'Reposted an update',
    eyebrow: 'Reposted',
  }));

  const jobs = [
    ...(input.jobApplications ?? [])
      .filter((row) => hasRowText(row, 'Application Date'))
      .map((row) => {
        const title = text(row, 'Job Title') || 'LinkedIn job';
        const company = text(row, 'Company Name');
        return {
          id: `job-application-${row.__row}`,
          kind: 'job' as const,
          subtype: 'job-applied' as const,
          date: text(row, 'Application Date'),
          dateTemporal: row.__dates?.['Application Date'],
          href: text(row, 'Job Url'),
          targetName: company || undefined,
          text: company ? `Applied to ${title} at ${company}` : `Applied to ${title}`,
          eyebrow: 'Job application',
        };
      }),
    ...(input.savedJobs ?? [])
      .filter((row) => hasRowText(row, 'Saved Date'))
      .map((row) => {
        const title = text(row, 'Job Title') || 'LinkedIn job';
        const company = text(row, 'Company Name');
        return {
          id: `saved-job-${row.__row}`,
          kind: 'job' as const,
          subtype: 'job-saved' as const,
          date: text(row, 'Saved Date'),
          dateTemporal: row.__dates?.['Saved Date'],
          href: text(row, 'Job Url'),
          targetName: company || undefined,
          text: company ? `Saved job: ${title} at ${company}` : `Saved job: ${title}`,
          eyebrow: 'Saved job',
        };
      }),
  ];

  const adsClicked = (input.adsClicked ?? [])
    .filter((row) => hasRowText(row, 'Ad clicked Date'))
    .map((row) => ({
      id: `ad-clicked-${row.__row}`,
      kind: 'ad' as const,
      date: text(row, 'Ad clicked Date'),
      dateTemporal: row.__dates?.['Ad clicked Date'],
      text: text(row, 'Ad Title/Id') ? `Clicked ad ${text(row, 'Ad Title/Id')}` : 'Clicked an ad',
      eyebrow: 'Ad clicked',
    }));

  const savedItems = (input.savedItems ?? [])
    .filter((row) => hasRowText(row, 'CreatedTime'))
    .map((row) => ({
      id: `saved-item-${row.__row}`,
      kind: 'saved-item' as const,
      date: text(row, 'CreatedTime'),
      dateTemporal: row.__dates?.CreatedTime,
      href: text(row, 'savedItem'),
      text: 'Saved a LinkedIn item',
      eyebrow: 'Saved item',
    }));

  const endorsements = [
    ...(input.endorsementsGiven ?? [])
      .filter((row) => hasRowText(row, 'Endorsement Date'))
      .map((row) => {
        const name = [text(row, 'Endorsee First Name'), text(row, 'Endorsee Last Name')]
          .filter(Boolean)
          .join(' ');
        const skill = text(row, 'Skill Name');
        return {
          id: `endorsement-given-${row.__row}`,
          kind: 'endorsement' as const,
          subtype: 'endorsement-given' as const,
          date: text(row, 'Endorsement Date'),
          dateTemporal: row.__dates?.['Endorsement Date'],
          href: normalizeLinkedInHref(text(row, 'Endorsee Public Url')),
          targetName: name || undefined,
          text:
            name && skill
              ? `Endorsed ${name} for ${skill}`
              : skill
                ? `Gave an endorsement for ${skill}`
                : 'Gave an endorsement',
          eyebrow: 'Endorsement given',
          status: text(row, 'Endorsement Status') || undefined,
        };
      }),
    ...(input.endorsementsReceived ?? [])
      .filter((row) => hasRowText(row, 'Endorsement Date'))
      .map((row) => {
        const name = [text(row, 'Endorser First Name'), text(row, 'Endorser Last Name')]
          .filter(Boolean)
          .join(' ');
        const skill = text(row, 'Skill Name');
        return {
          id: `endorsement-received-${row.__row}`,
          kind: 'endorsement' as const,
          subtype: 'endorsement-received' as const,
          date: text(row, 'Endorsement Date'),
          dateTemporal: row.__dates?.['Endorsement Date'],
          href: normalizeLinkedInHref(text(row, 'Endorser Public Url')),
          targetName: name || undefined,
          text:
            name && skill
              ? `Received endorsement for ${skill} from ${name}`
              : skill
                ? `Received endorsement for ${skill}`
                : 'Received an endorsement',
          eyebrow: 'Endorsement received',
          status: text(row, 'Endorsement Status') || undefined,
        };
      }),
  ];

  const account = [
    ...(input.emailAddresses ?? [])
      .filter((row) => hasRowText(row, 'Updated On'))
      .map((row) => ({
        id: `email-address-${row.__row}`,
        kind: 'account' as const,
        subtype: 'account-email-update' as const,
        date: text(row, 'Updated On'),
        dateTemporal: row.__dates?.['Updated On'],
        text: text(row, 'Email Address')
          ? `Updated email address: ${text(row, 'Email Address')}`
          : 'Updated an email address',
        eyebrow: 'Account update',
        status:
          [
            text(row, 'Primary') === 'Yes' ? 'primary' : '',
            text(row, 'Confirmed') === 'Yes' ? 'confirmed' : '',
          ]
            .filter(Boolean)
            .join(' · ') || undefined,
      })),
    ...(input.registration ?? [])
      .filter((row) => hasRowText(row, 'Registered At'))
      .map((row) => ({
        id: `registration-${row.__row}`,
        kind: 'account' as const,
        subtype: 'account-registration' as const,
        date: text(row, 'Registered At'),
        dateTemporal: row.__dates?.['Registered At'],
        text: text(row, 'Registration Ip')
          ? `Registered LinkedIn account from ${text(row, 'Registration Ip')}`
          : 'Registered LinkedIn account',
        eyebrow: 'Account created',
        registrationIp: text(row, 'Registration Ip') || undefined,
      })),
    ...(input.importedContacts ?? [])
      .filter((row) => hasRowText(row, 'CreatedAt'))
      .map((row) => {
        const name = compactName(
          text(row, 'FirstName'),
          text(row, 'MiddleName'),
          text(row, 'LastName'),
          text(row, 'NickName'),
        );
        const details: Record<string, string> = {};
        const detailFields: Array<[string, string]> = [
          ['Email', text(row, 'Emails')],
          ['Phone', text(row, 'PhoneNumbers')],
          ['Title', text(row, 'Title')],
          ['Location', text(row, 'Location')],
          ['Country', text(row, 'CountryCode')],
          ['Region', text(row, 'RegionCode')],
          ['Company', text(row, 'Location')],
        ];
        for (const [label, value] of detailFields) {
          if (value && !/^(n\/a|null|none)$/i.test(value)) details[label] = value;
        }
        return {
          id: `imported-contact-${row.__row}`,
          kind: 'account' as const,
          subtype: 'connection-imported' as const,
          date: text(row, 'CreatedAt'),
          dateTemporal: row.__dates?.CreatedAt,
          targetName: name || undefined,
          text: name || text(row, 'Emails') || 'Imported contact',
          eyebrow: 'Imported contact',
          importedContactDetails: Object.keys(details).length > 0 ? details : undefined,
        };
      }),
    ...(input.verifications ?? [])
      .filter((row) => hasRowText(row, 'Verified date'))
      .map((row) => {
        const verificationType = text(row, 'Verification type') || 'Verification';
        const organization = text(row, 'Organization name');
        const details: Record<string, string> = {};
        const fields: Array<[string, string]> = [
          ['Organization', organization],
          ['Email', text(row, 'Email address')],
          ['Country', text(row, 'Country')],
          ['State', text(row, 'State')],
          ['City', text(row, 'City')],
          ['Year of birth', text(row, 'Year of birth')],
          ['Issuing authority', text(row, 'Issuing authority')],
          ['Document type', text(row, 'Document type')],
          ['Service provider', text(row, 'Verification service provider')],
          ['Expiry date', text(row, 'Expiry date')],
        ];
        for (const [label, value] of fields) {
          if (value && !/^(n\/a|null|none)$/i.test(value)) details[label] = value;
        }
        return {
          id: `verification-${row.__row}`,
          kind: 'security' as const,
          subtype: 'security-verification' as const,
          date: text(row, 'Verified date'),
          dateTemporal: row.__dates?.['Verified date'],
          targetName: titleCase(verificationType),
          text: organization || '',
          eyebrow: 'Verification',
          verificationDetails: Object.keys(details).length > 0 ? details : undefined,
        };
      }),
    ...(input.receipts ?? [])
      .filter((row) => hasRowText(row, 'Transaction Made At'))
      .map((row) => {
        const description = text(row, 'Description');
        const totalAmount = text(row, 'Total Amount');
        const subTotal = text(row, 'Sub Total');
        const taxAmount = text(row, 'Tax Amount');
        const currency = text(row, 'Currency Code');
        return {
          id: `receipt-${row.__row}`,
          kind: 'account' as const,
          subtype: 'account-receipt' as const,
          date: text(row, 'Transaction Made At'),
          dateTemporal: row.__dates?.['Transaction Made At'],
          text: description || 'Receipt',
          eyebrow: 'Receipt',
          status: text(row, 'Payment Method Type') || undefined,
          receiptSubTotal: subTotal || undefined,
          receiptTaxAmount: taxAmount || undefined,
          receiptTotalAmount: totalAmount || undefined,
          receiptCurrency: currency || undefined,
        };
      }),
  ];

  const security = [
    ...(input.logins ?? [])
      .filter((row) => hasRowText(row, 'Login Date'))
      .map((row) => ({
        id: `login-${row.__row}`,
        kind: 'security' as const,
        subtype: 'security-login' as const,
        date: text(row, 'Login Date'),
        dateTemporal: row.__dates?.['Login Date'],
        targetName: text(row, 'Login Type') || 'Login',
        text: text(row, 'IP Address') || 'Login',
        eyebrow: text(row, 'Login Type') || 'Login',
        loginIp: text(row, 'IP Address') || undefined,
        loginUserAgent: text(row, 'User Agent') || undefined,
      })),
    ...(input.securityChallenges ?? [])
      .filter((row) => hasRowText(row, 'Challenge Date'))
      .map((row) => {
        const challengeType = text(row, 'Challenge Type');
        const country = text(row, 'Country');
        return {
          id: `security-challenge-${row.__row}`,
          kind: 'security' as const,
          subtype: 'security-challenge' as const,
          date: text(row, 'Challenge Date'),
          dateTemporal: row.__dates?.['Challenge Date'],
          targetName: challengeType || 'Security challenge',
          text: country,
          eyebrow: 'Security challenge',
          challengeIp: text(row, 'IP Address') || undefined,
          challengeUserAgent: text(row, 'User Agent') || undefined,
        };
      }),
  ];

  const searches = (input.searchQueries ?? [])
    .filter((row) => hasRowText(row, 'Time'))
    .map((row) => ({
      id: `search-query-${row.__row}`,
      kind: 'search' as const,
      date: text(row, 'Time'),
      dateTemporal: row.__dates?.Time,
      text: text(row, 'Search Query')
        ? `Searched for “${text(row, 'Search Query')}”`
        : 'Performed a search',
      eyebrow: 'Search',
    }));

  const ownerName = normalizeActivityName(input.ownerName);
  const messageActivities = [
    ...buildMessageActivities(input.messages ?? [], 'message', ownerName),
    ...buildMessageActivities(input.guideMessages ?? [], 'guide-message', ownerName),
    ...buildMessageActivities(
      input.learningCoachMessages ?? [],
      'learning-coach-message',
      ownerName,
    ),
    ...buildMessageActivities(
      input.learningRolePlayMessages ?? [],
      'learning-role-play-message',
      ownerName,
    ),
  ];

  const learningActivities = (input.learning ?? [])
    .map((row) => learningActivity(row))
    .filter((item): item is ActivityItem => Boolean(item));

  const connections = (input.connections ?? []).map((row) => {
    const nameParts = [text(row, 'First Name'), text(row, 'Last Name')].filter(Boolean);
    const name = nameParts.join(' ') || text(row, 'URL') || 'Connection';
    return {
      id: `connection-${row.__row}`,
      kind: 'connection' as const,
      date: text(row, 'Connected On'),
      dateTemporal: row.__dates?.['Connected On'],
      href: text(row, 'URL'),
      targetName: name,
      text: `Connected with ${name}`,
      eyebrow: 'Connected',
    };
  });

  // CHQ: Claude AI (Sonnet) refactored
  const memberFollows = (input.memberFollows ?? []).map((row) => {
    const status = text(row, 'Status')?.toLowerCase() ?? '';
    const name = text(row, 'FullName') || 'LinkedIn member';

    const [kind, eyebrow, label] =
      status === 'unfollow'
        ? (['person-unfollow', 'Unfollowed', `Unfollowed ${name}`] as const)
        : status === 'mute'
          ? (['person-mute', 'Muted', `Muted ${name}`] as const)
          : (['member-follow', 'Followed', name] as const);

    return {
      id: `member-follow-${row.__row}`,
      kind,
      date: text(row, 'Date'),
      dateTemporal: row.__dates?.Date,
      targetName: name,
      text: label,
      eyebrow,
    };
  });

  const companyFollows = (input.companyFollows ?? []).map((row) => ({
    id: `company-follow-${row.__row}`,
    kind: 'company-follow' as const,
    date: text(row, 'Followed On'),
    dateTemporal: row.__dates?.['Followed On'],
    targetName: text(row, 'Organization') || 'LinkedIn page',
    text: text(row, 'Organization') || 'Followed a page',
    eyebrow: 'Followed',
  }));

  const hashtagFollows = (input.hashtagFollows ?? []).map((row) => {
    const tag = text(row, 'HashTag') || text(row, 'Tag') || '';
    return {
      id: `hashtag-follow-${row.__row}`,
      kind: 'hashtag-follow' as const,
      date: text(row, 'CreatedTime') || text(row, 'Date') || '',
      dateTemporal: row.__dates?.CreatedTime ?? row.__dates?.Date,
      targetName: tag,
      text: tag ? `Followed #${tag}` : 'Followed a hashtag',
      eyebrow: 'Followed',
    };
  });

  const recommendationsReceived = (input.recommendationsReceived ?? []).map((row) =>
    recommendationActivity(row, 'recommendation-received'),
  );

  const recommendationsGiven = (input.recommendationsGiven ?? []).map((row) =>
    recommendationActivity(row, 'recommendation-given'),
  );

  const invitations = (input.invitations ?? [])
    .map((row) => {
      const dir = (text(row, 'Direction') || '').toUpperCase();
      const sentAt = text(row, 'Sent At');
      const from = text(row, 'From');
      const to = text(row, 'To');
      if (dir === 'OUTGOING') {
        return {
          id: `invitation-sent-${row.__row}`,
          kind: 'invitation-sent' as const,
          date: sentAt,
          dateTemporal: row.__dates?.['Sent At'],
          href: text(row, 'inviteeProfileUrl'),
          targetName: to || '',
          text: `Sent invitation to ${to || ''}`.trim(),
          eyebrow: 'Invitation sent',
        };
      }
      return {
        id: `invitation-received-${row.__row}`,
        kind: 'invitation-received' as const,
        date: sentAt,
        dateTemporal: row.__dates?.['Sent At'],
        href: text(row, 'inviterProfileUrl'),
        targetName: from || '',
        text: `Invitation from ${from || ''}`.trim(),
        eyebrow: 'Invitation received',
      };
    })
    .filter(Boolean);

  const eventActivities = (input.events ?? []).map((row) => {
    const raw = text(row, 'Event Time');
    const start = raw.split(' - ')[0] ?? raw;
    const temporal = row.__dates?.['Event Time'] ?? parseTemporalValue(start);
    return {
      id: `event-${row.__row}`,
      kind: 'event' as const,
      date: raw || text(row, 'Event Name'),
      dateTemporal: temporal,
      text: text(row, 'Event Name') || 'Event',
      eyebrow: 'Event',
      status: text(row, 'Status') || undefined,
      href: text(row, 'External Url') || undefined,
    };
  });

  return [
    ...posts,
    ...richMedia,
    ...comments,
    ...reactions,
    ...votes,
    ...reposts,
    ...jobs,
    ...adsClicked,
    ...savedItems,
    ...endorsements,
    ...account,
    ...security,
    ...searches,
    ...messageActivities,
    ...learningActivities,
    ...connections,
    ...memberFollows,
    ...companyFollows,
    ...hashtagFollows,
    ...recommendationsReceived,
    ...recommendationsGiven,
    ...invitations,
    ...eventActivities,
  ].sort((a, b) => activityDateTime(b) - activityDateTime(a));
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function voteSummary(optionText: string): string {
  return optionText ? `Voted: ${optionText}` : 'Voted in a poll';
}

function compactName(...parts: string[]): string {
  return parts.filter(Boolean).join(' ');
}

function hasRowText(row: DatasetRow | undefined, key: string): boolean {
  return text(row, key).length > 0;
}

function meaningfulText(row: DatasetRow, key: string): string {
  const raw = text(row, key).trim();
  return raw && raw !== '-' ? raw : '';
}

function normalizeLinkedInHref(value: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  if (/^linkedin\.com\//i.test(value)) return `https://${value}`;
  return undefined;
}

function buildMessageActivities(
  rows: DatasetRow[],
  source: 'message' | 'guide-message' | 'learning-coach-message' | 'learning-role-play-message',
  ownerName: string,
): ActivityItem[] {
  return rows
    .filter((row) => hasRowText(row, 'DATE'))
    .map((row) => {
      const from = text(row, 'FROM');
      const to = text(row, 'TO');
      const normalizedFrom = normalizeActivityName(from);
      const sentByOwner = ownerName.length > 0 && normalizedFrom === ownerName;
      const counterpart = sentByOwner ? to || from : from || to;
      return {
        id: `${source}-${row.__row}`,
        kind: 'message' as const,
        subtype: sentByOwner ? ('message-sent' as const) : ('message-received' as const),
        date: text(row, 'DATE'),
        dateTemporal: row.__dates?.DATE,
        href: messageProfileHref(row, sentByOwner),
        targetName: counterpart || undefined,
        text: messageText(row, sentByOwner, counterpart),
        eyebrow: messageEyebrow(source, sentByOwner),
      };
    });
}

function normalizeActivityName(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function messageProfileHref(row: DatasetRow, sentByOwner: boolean): string | undefined {
  if (sentByOwner) {
    return firstListItem(text(row, 'RECIPIENT PROFILE URLS')) || undefined;
  }
  return text(row, 'SENDER PROFILE URL') || undefined;
}

function firstListItem(value: string): string {
  return (
    value
      .split(';')
      .map((part) => part.trim())
      .find(Boolean) ?? ''
  );
}

function messageText(row: DatasetRow, sentByOwner: boolean, counterpart: string): string {
  const content = displayText(text(row, 'CONTENT'));
  const subject = displayText(text(row, 'SUBJECT'));
  const body = content || subject;
  if (body && counterpart) {
    return sentByOwner ? `To ${counterpart}: ${body}` : `${counterpart}: ${body}`;
  }
  if (body) return body;
  return sentByOwner ? 'Sent a message' : 'Received a message';
}

function messageEyebrow(
  source: 'message' | 'guide-message' | 'learning-coach-message' | 'learning-role-play-message',
  sentByOwner: boolean,
): string {
  if (source === 'guide-message')
    return sentByOwner ? 'Sent guide message' : 'Received guide message';
  if (source === 'learning-coach-message') return 'Learning coach message';
  if (source === 'learning-role-play-message') return 'Learning role-play message';
  return sentByOwner ? 'Sent message' : 'Received message';
}

function learningActivity(row: DatasetRow): ActivityItem | undefined {
  const completedRaw = meaningfulValue(text(row, 'Content Completed At (if completed)'));
  const watchedRaw = meaningfulValue(text(row, 'Content Last Watched Date (if viewed)'));
  const rawDate = completedRaw || watchedRaw;
  if (!rawDate) return undefined;

  const dateKey = completedRaw
    ? 'Content Completed At (if completed)'
    : 'Content Last Watched Date (if viewed)';
  const title = text(row, 'Content Title') || 'Learning content';
  const contentType = text(row, 'Content Type');
  const verb = completedRaw ? 'Completed' : 'Viewed';

  return {
    id: `learning-${row.__row}`,
    kind: 'learning',
    date: rawDate,
    dateTemporal: row.__dates?.[dateKey] ?? parseTemporalValue(rawDate),
    targetName: title,
    text: contentType ? `${verb} ${contentType.toLowerCase()}: ${title}` : `${verb} ${title}`,
    eyebrow: completedRaw ? 'Learning completed' : 'Learning viewed',
    status: text(row, 'Content Saved') === 'true' ? 'saved' : undefined,
    learningDescription: text(row, 'Content Description') || undefined,
  };
}

function meaningfulValue(value: string): string {
  return /^(n\/a|null|none)$/i.test(value) ? '' : value;
}

function recommendationActivity(
  row: DatasetRow,
  kind: 'recommendation-given' | 'recommendation-received',
): ActivityItem {
  const name = [text(row, 'First Name'), text(row, 'Last Name')].filter(Boolean).join(' ');
  const headline = [text(row, 'Job Title'), text(row, 'Company')].filter(Boolean).join(' · ');

  return {
    id: `${kind}-${row.__row}`,
    kind,
    date: text(row, 'Creation Date'),
    dateTemporal: row.__dates?.['Creation Date'],
    targetName: name || 'LinkedIn member',
    headline: headline || undefined,
    text: text(row, 'Text'),
    eyebrow:
      kind === 'recommendation-received' ? 'Recommendation received' : 'Recommendation given',
    status: text(row, 'Status') || undefined,
  };
}

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) return value;
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const leadingWhitespace = value.match(/^\s*/)?.[0] ?? '';
    const trailingWhitespace = value.match(/\s*$/)?.[0] ?? '';
    return `${leadingWhitespace}${trimmed.slice(1, -1)}${trailingWhitespace}`;
  }
  return value;
}

function rowDateTime(row: DatasetRow, key: string): number {
  const temporal = row.__dates?.[key];
  if (temporal?.epochMs !== undefined) return temporal.epochMs;
  return dateTime(text(row, key));
}

export function activityDateTime(activity: ActivityItem): number {
  if (activity.dateTemporal?.epochMs !== undefined) return activity.dateTemporal.epochMs;
  return dateTime(activity.date);
}
