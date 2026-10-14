import {
  FileText,
  Image,
  MessageSquare,
  Repeat2,
  ThumbsUp,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  Building2,
  CalendarDays,
  ArrowRightFromLine,
  ArrowLeftToLine,
  Hash,
  Quote,
  X,
  BriefcaseBusiness,
  Megaphone,
  Bookmark,
  Mail,
  Shield,
  Star,
  User,
  Search,
  GraduationCap,
  Grape,
  CreditCard,
  Folder,
  Vote,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveImport } from '../../app/useImports';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { TemporalMosaic, type TemporalMosaicSelection } from '../../components/TemporalMosaic';
import {
  availableCalendarYears,
  bucketTimestampsByDay,
  formatMonthKey,
  parseDayKey,
  parseMonthKey,
  periodForYear,
  timestampInPeriod,
  type TemporalMosaicPeriod,
} from '../../lib/datetime/yearMosaic';
import { searchActivities } from '../../lib/search/activitySearch';
import { ActivityCard } from './ActivityCard';
import { activityDateTime, fullName, type ActivityItem, type ActivityKind } from '../profile/model';
import { useProfileData, type ProfileData } from '../profile/useProfileData';

const PAGE_SIZE = 100;
const MONTH_BADGE_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'long' });
const DAY_BADGE_FORMATTER = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });

type ActivityFilter =
  | 'all'
  | ActivityKind
  | 'content'
  | 'connections'
  | 'engagement'
  | 'connection-imported'
  | 'recommendations'
  | 'job-applied'
  | 'job-saved'
  | 'misc'
  | 'endorsement-given'
  | 'endorsement-received'
  | 'account-created'
  | 'account-email-updates'
  | 'receipts'
  | 'message-sent'
  | 'message-received'
  | 'security-verifications'
  | 'security-logins'
  | 'security-challenges'
  | 'vote';

type ActivityRailItem = {
  filter: ActivityFilter;
  label: string;
  Icon: LucideIcon;
  menuLabel?: string;
  children?: ActivityRailItem[];
};

export function ActivityPage() {
  const active = useActiveImport();
  const { data, loading, error } = useProfileData(active);

  if (!active) {
    return (
      <EmptyState
        title="No active import"
        description="Import a LinkedIn export ZIP before browsing activity."
        action={
          <Link to="/imports" className="btn btn-primary">
            Import data
          </Link>
        }
      />
    );
  }
  if (loading) return <div className="loading loading-spinner" aria-label="Loading activity" />;
  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }
  if (!data) return <EmptyState title="No activity data found" />;

  return <ActivityPageContent data={data} />;
}

function SearchBar({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handleSearch = () => {
      // The native "search" event fires on both Enter and the clear (×) button.
      // Only reset when the input is empty (clear button clicked).
      if (!input.value) {
        setDraft('');
        onSubmit('');
      }
    };
    input.addEventListener('search', handleSearch);
    return () => input.removeEventListener('search', handleSearch);
  }, [onSubmit]);

  return (
    <div className="join w-full sm:w-72">
      <input
        ref={inputRef}
        type="search"
        className="input input-bordered input-sm join-item w-full"
        placeholder="Search activity…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit(draft.trim());
        }}
        aria-label="Search activity"
      />
      <button
        type="button"
        className="btn btn-sm btn-primary join-item"
        onClick={() => onSubmit(draft.trim())}
        aria-label="Search"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function ActivityPageContent({ data }: { data: ProfileData }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const filter = filterFromParams(searchParams.get('type'));
  const [query, setQuery] = useState('');

  const name = fullName(data.profile);
  const years = availableCalendarYears(data.activity, activityDateTime);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const selectedPeriod = periodFromRangeParams(fromParam, toParam);
  const selectedYear: number | 'all' =
    fromParam === 'all'
      ? 'all'
      : (selectedPeriod?.year ?? (fromParam === null ? new Date().getFullYear() : 'all'));
  const effectivePeriod: TemporalMosaicPeriod | undefined =
    selectedPeriod ?? (selectedYear !== 'all' ? { kind: 'year', year: selectedYear } : undefined);
  const mosaicSelection = selectedPeriod ? selectionFromPeriod(selectedPeriod) : undefined;
  const yearActivities =
    selectedYear === 'all'
      ? data.activity
      : data.activity.filter((item) =>
          timestampInPeriod(activityDateTime(item), periodForYear(selectedYear)),
        );
  const counts = countByKind(yearActivities);
  const typedYearActivities =
    filter === 'all'
      ? yearActivities
      : yearActivities.filter((item) => matchesActivityFilter(item, filter));
  const countsByDay = bucketTimestampsByDay(typedYearActivities, activityDateTime);
  const filtered =
    selectedYear === 'all' || !effectivePeriod
      ? typedYearActivities
      : filterByPeriod(typedYearActivities, effectivePeriod);
  const searchedFiltered = useMemo(() => searchActivities(filtered, query), [filtered, query]);
  const pageRows = searchedFiltered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const yearOptions: Array<number | 'all'> = ['all', ...years];

  function submitSearch(value: string) {
    setPage(0);
    setQuery(value);
  }

  const selectedIndex = selectedYear === 'all' ? -1 : years.indexOf(selectedYear as number);

  function isPrevDisabled(): boolean {
    return selectedIndex < 0 || selectedIndex >= years.length - 1;
  }

  function isNextDisabled(): boolean {
    return selectedIndex <= 0;
  }

  function goToPrevYear() {
    if (selectedYear === 'all') return;
    const idx = years.indexOf(selectedYear as number);
    const prev = years[idx + 1];
    if (prev !== undefined) updateYear(prev);
  }

  function goToNextYear() {
    if (selectedYear === 'all') return;
    const idx = years.indexOf(selectedYear as number);
    const next = years[idx - 1];
    if (next !== undefined) updateYear(next);
  }

  function clearTemporalSelection() {
    if (selectedYear === 'all') return;
    updateYear(selectedYear);
  }

  const yearControls = (
    <div className="join">
      <button
        type="button"
        className="join-item btn btn-sm"
        onClick={() => goToPrevYear()}
        aria-label="Previous year"
        disabled={isPrevDisabled()}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <select
        className="join-item select select-bordered select-sm w-full max-w-36"
        value={String(selectedYear)}
        onChange={(event) => {
          const v = event.target.value;
          updateYear(v === 'all' ? 'all' : Number(v));
        }}
        aria-label="Activity year"
      >
        {yearOptions.map((y) => (
          <option key={String(y)} value={String(y)}>
            {y === 'all' ? 'All' : y}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="join-item btn btn-sm"
        onClick={() => goToNextYear()}
        aria-label="Next year"
        disabled={isNextDisabled()}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  const filtersList = (
    <ActivityRail activeFilter={filter} counts={counts} onSelect={updateFilter} />
  );

  return (
    <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden md:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">{filtersList}</div>
      </aside>

      <main className="min-w-0 space-y-4">
        <section className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
          <div className="flex justify-end">
            <Link to="/profile" className="btn btn-sm btn-ghost">
              Back to profile
            </Link>
          </div>

          <div className="mt-4 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchBar onSubmit={submitSearch} />
              {yearControls}
            </div>

            {selectedYear === 'all' ? (
              <p className="text-sm opacity-70">
                Select a specific year to browse the activity calendar by month and day.
              </p>
            ) : (
              <div className="space-y-0">
                <TemporalMosaic
                  year={selectedYear}
                  countsByDay={countsByDay}
                  selected={mosaicSelection}
                  itemLabel="activity"
                  ariaLabel={`${selectedYear} activity calendar`}
                  onMonthSelect={updateMonth}
                  onDaySelect={updateDay}
                />

                <SelectedPeriodBadge period={selectedPeriod} onRemove={clearTemporalSelection} />
              </div>
            )}
          </div>

          <div className="mt-4 md:hidden">{filtersList}</div>
        </section>

        {pageRows.length === 0 ? (
          <EmptyState
            title={query ? `No results for "${query}"` : emptyTitle(filter, selectedPeriod)}
          />
        ) : (
          <div className="space-y-4">
            {pageRows.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                profileName={name}
                linkedInProfile={data.linkedInProfile}
              />
            ))}
          </div>
        )}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={searchedFiltered.length}
          onPageChange={setPage}
        />
      </main>
    </div>
  );

  function updateFilter(next: ActivityFilter) {
    updateSearchParams((params) => {
      if (next === 'all') params.delete('type');
      else params.set('type', next);
    });
  }

  function updateYear(next: number | 'all') {
    updateSearchParams((params) => {
      if (next === 'all') {
        params.set('from', 'all');
        params.delete('to');
      } else {
        params.set('from', `${next}-01-01`);
        params.set('to', `${next}-12-31`);
      }
    });
  }

  function updateMonth(monthKey: string) {
    if (!effectivePeriod) return;
    updateSearchParams((params) => {
      if (effectivePeriod.kind === 'month' && effectivePeriod.key === monthKey) {
        // Toggle off → back to year view
        params.set('from', `${selectedYear}-01-01`);
        params.set('to', `${selectedYear}-12-31`);
      } else {
        const parsed = parseMonthKey(monthKey);
        if (!parsed) return;
        const lastDay = new Date(parsed.year, parsed.monthIndex + 1, 0).getDate();
        params.set('from', `${monthKey}-01`);
        params.set('to', `${monthKey}-${String(lastDay).padStart(2, '0')}`);
      }
    });
  }

  function updateDay(dayKey: string) {
    if (!effectivePeriod) return;
    updateSearchParams((params) => {
      if (effectivePeriod.kind === 'day' && effectivePeriod.key === dayKey) {
        // Toggle off → back to year view
        params.set('from', `${selectedYear}-01-01`);
        params.set('to', `${selectedYear}-12-31`);
      } else {
        params.set('from', dayKey);
        params.set('to', dayKey);
      }
    });
  }

  function updateSearchParams(update: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams);
    update(next);
    setPage(0);
    setSearchParams(next);
  }
}

function SelectedPeriodBadge({
  period,
  onRemove,
}: {
  period?: TemporalMosaicPeriod;
  onRemove: () => void;
}) {
  const label = labelForSelectedPeriod(period);
  if (!label) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <div className="badge badge-success badge-sm gap-1.5 px-2 py-2 text-xs font-medium text-success-content">
        <span>{label}</span>
        <button
          type="button"
          className="rounded-full p-0.5 text-success-content/80 transition hover:bg-success-content/15 hover:text-success-content focus:outline-none focus-visible:ring-2 focus-visible:ring-success-content"
          aria-label={`Clear ${label} filter`}
          onClick={onRemove}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ActivityRail({
  activeFilter,
  counts,
  onSelect,
}: {
  activeFilter: ActivityFilter;
  counts: Record<ActivityFilter, number>;
  onSelect: (filter: ActivityFilter) => void;
}) {
  const allItem: ActivityRailItem = {
    filter: 'all',
    label: 'All activity',
    menuLabel: 'All',
    Icon: UserRound,
  };

  const rootItems: ActivityRailItem[] = [
    {
      filter: 'content',
      label: 'Contents',
      Icon: FileText,
      children: [
        { filter: 'post', label: 'Posts', Icon: FileText },
        { filter: 'comment', label: 'Comments', Icon: MessageSquare },
        { filter: 'rich-media', label: 'Rich media', Icon: Image },
      ],
    },
    {
      filter: 'engagement',
      label: 'Engagements',
      Icon: ThumbsUp,
      children: [
        { filter: 'reaction', label: 'Reactions', Icon: ThumbsUp },
        { filter: 'vote', label: 'Votes', Icon: Vote },
        { filter: 'repost', label: 'Reposts', Icon: Repeat2 },
        { filter: 'member-follow', label: 'Following', Icon: UserPlus },
        { filter: 'person-mute', label: 'Muted', Icon: UserPlus },
        { filter: 'person-unfollow', label: 'Unfollowed', Icon: UserPlus },
        { filter: 'company-follow', label: 'Pages', Icon: Building2 },
        { filter: 'hashtag-follow', label: 'Hashtags', Icon: Hash },
        { filter: 'saved-item', label: 'Saved items', Icon: Bookmark },
        { filter: 'event', label: 'Events', Icon: CalendarDays },
      ],
    },
    {
      filter: 'connections',
      label: 'Connections',
      Icon: Users,
      children: [
        {
          filter: 'connection',
          label: 'Established connections',
          menuLabel: 'Established',
          Icon: Users,
        },
        {
          filter: 'invitation-sent',
          label: 'Sent connections',
          menuLabel: 'Sent',
          Icon: ArrowRightFromLine,
        },
        {
          filter: 'invitation-received',
          label: 'Received connections',
          menuLabel: 'Received',
          Icon: ArrowLeftToLine,
        },
        {
          filter: 'connection-imported',
          label: 'Imported contacts',
          menuLabel: 'Imported',
          Icon: Users,
        },
      ],
    },
    {
      filter: 'message',
      label: 'Messages',
      Icon: Mail,
      children: [
        {
          filter: 'message-sent',
          label: 'Sent messages',
          menuLabel: 'Sent',
          Icon: ArrowRightFromLine,
        },
        {
          filter: 'message-received',
          label: 'Received messages',
          menuLabel: 'Received',
          Icon: ArrowLeftToLine,
        },
      ],
    },
    {
      filter: 'recommendations',
      label: 'Recommendations',
      Icon: Quote,
      children: [
        {
          filter: 'recommendation-given',
          label: 'Recommendations sent',
          menuLabel: 'Sent',
          Icon: ArrowRightFromLine,
        },
        {
          filter: 'recommendation-received',
          label: 'Recommendations received',
          menuLabel: 'Received',
          Icon: ArrowLeftToLine,
        },
      ],
    },
    {
      filter: 'endorsement',
      label: 'Endorsements',
      Icon: Grape,
      children: [
        {
          filter: 'endorsement-given',
          label: 'Endorsements sent',
          menuLabel: 'Sent',
          Icon: ArrowRightFromLine,
        },
        {
          filter: 'endorsement-received',
          label: 'Endorsements received',
          menuLabel: 'Received',
          Icon: ArrowLeftToLine,
        },
      ],
    },
    {
      filter: 'job',
      label: 'Jobs',
      Icon: BriefcaseBusiness,
      children: [
        {
          filter: 'job-applied',
          label: 'Applied jobs',
          menuLabel: 'Applied',
          Icon: BriefcaseBusiness,
        },
        {
          filter: 'job-saved',
          label: 'Saved jobs',
          menuLabel: 'Saved',
          Icon: Bookmark,
        },
      ],
    },
    {
      filter: 'security',
      label: 'Account',
      Icon: User,
      children: [
        {
          filter: 'security-verifications',
          label: 'Security verifications',
          menuLabel: 'Verifications',
          Icon: Shield,
        },
        { filter: 'security-logins', label: 'Logins', Icon: Shield },
        { filter: 'security-challenges', label: 'Challenges', Icon: Shield },
        { filter: 'account-email-updates', label: 'Email updates', menuLabel: 'Email', Icon: Mail },
        { filter: 'account-created', label: 'Creation', Icon: Star },
      ],
    },
    {
      filter: 'misc',
      label: 'Misc',
      Icon: Folder,
      children: [
        { filter: 'search', label: 'Searches', Icon: Search },
        { filter: 'ad', label: 'Ads clicked', Icon: Megaphone },
        { filter: 'receipts', label: 'Receipts', Icon: CreditCard },
        { filter: 'learning', label: 'Learning', Icon: GraduationCap },
      ],
    },
  ];

  const railBadgeClass = (filter: ActivityFilter) => {
    // All — neutral
    if (filter === 'all') return 'badge-neutral';
    // Root nodes — ghost
    if (
      filter === 'content' ||
      filter === 'engagement' ||
      filter === 'connections' ||
      filter === 'message' ||
      filter === 'recommendations' ||
      filter === 'endorsement' ||
      filter === 'job' ||
      filter === 'security' ||
      filter === 'misc'
    )
      return 'badge-ghost';
    // Secondary
    if (
      filter === 'post' ||
      filter === 'search' ||
      filter === 'endorsement-given' ||
      filter === 'recommendation-given' ||
      filter === 'message-sent'
    )
      return 'badge-secondary';
    // Warning
    if (
      filter === 'person-mute' ||
      filter === 'person-unfollow' ||
      filter === 'comment' ||
      filter === 'reaction' ||
      filter === 'vote' ||
      filter === 'repost' ||
      filter === 'invitation-sent' ||
      filter === 'job-applied' ||
      filter === 'security-verifications'
    )
      return 'badge-warning';
    // Success
    if (
      filter === 'connection' ||
      filter === 'member-follow' ||
      filter === 'company-follow' ||
      filter === 'learning' ||
      filter === 'security-logins'
    )
      return 'badge-success';
    // Accent
    if (
      filter === 'hashtag-follow' ||
      filter === 'saved-item' ||
      filter === 'job-saved' ||
      filter === 'endorsement-received' ||
      filter === 'recommendation-received' ||
      filter === 'message-received' ||
      filter === 'invitation-received' ||
      filter === 'receipts'
    )
      return 'badge-accent';
    // Info
    if (
      filter === 'event' ||
      filter === 'account-email-updates' ||
      filter === 'account-created' ||
      filter === 'rich-media'
    )
      return 'badge-info';
    // Error
    if (filter === 'connection-imported' || filter === 'security-challenges' || filter === 'ad')
      return 'badge-error';
    return 'badge-ghost';
  };

  const renderRailItem = (item: ActivityRailItem) => {
    const active = activeFilter === item.filter;
    const count = counts[item.filter];
    const badgeColor = railBadgeClass(item.filter);
    return (
      <li key={item.filter}>
        <button
          type="button"
          className={active ? 'menu-active' : ''}
          onClick={() => onSelect(item.filter)}
          aria-pressed={active}
        >
          <item.Icon className="h-4 w-4 shrink-0 opacity-70" />
          {item.menuLabel ? (
            <>
              <span className="sr-only">{item.label}</span>
              <span aria-hidden="true" className="truncate">
                {item.menuLabel}
              </span>
            </>
          ) : (
            <span className="truncate">{item.label}</span>
          )}
          {count > 0 ? (
            <span className={`badge badge-sm ml-auto tabular-nums ${badgeColor}`}>
              {count.toLocaleString()}
            </span>
          ) : null}
        </button>
        {item.children?.length ? <ul>{item.children.map(renderRailItem)}</ul> : null}
      </li>
    );
  };

  return (
    <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
      <nav aria-label="Activity filters" className="p-2">
        <ul className="menu w-full p-0">
          {renderRailItem(allItem)}
          {rootItems.map(renderRailItem)}
        </ul>
      </nav>
    </section>
  );
}

function filterFromParams(value: string | null): ActivityFilter {
  return value === 'post' ||
    value === 'comment' ||
    value === 'content' ||
    value === 'reaction' ||
    value === 'repost' ||
    value === 'rich-media' ||
    value === 'connections' ||
    value === 'engagement' ||
    value === 'connection-imported' ||
    value === 'recommendations' ||
    value === 'job' ||
    value === 'job-applied' ||
    value === 'job-saved' ||
    value === 'ad' ||
    value === 'misc' ||
    value === 'saved-item' ||
    value === 'endorsement' ||
    value === 'endorsement-given' ||
    value === 'endorsement-received' ||
    value === 'account' ||
    value === 'account-created' ||
    value === 'account-email-updates' ||
    value === 'receipts' ||
    value === 'security' ||
    value === 'security-verifications' ||
    value === 'security-logins' ||
    value === 'security-challenges' ||
    value === 'search' ||
    value === 'message' ||
    value === 'message-sent' ||
    value === 'message-received' ||
    value === 'learning' ||
    value === 'connection' ||
    value === 'member-follow' ||
    value === 'person-unfollow' ||
    value === 'person-mute' ||
    value === 'company-follow' ||
    value === 'hashtag-follow' ||
    value === 'recommendation-given' ||
    value === 'recommendation-received' ||
    value === 'invitation-sent' ||
    value === 'invitation-received' ||
    value === 'event' ||
    value === 'vote'
    ? (value as ActivityFilter)
    : 'all';
}

function periodFromRangeParams(
  from: string | null,
  to: string | null,
): TemporalMosaicPeriod | undefined {
  if (!from || !to) return undefined;

  const fromParsed = parseDayKey(from);
  const toParsed = parseDayKey(to);
  if (!fromParsed || !toParsed) return undefined;

  // Same day → day period
  if (from === to) {
    return {
      kind: 'day',
      key: from,
      year: fromParsed.year,
      monthIndex: fromParsed.monthIndex,
      dayOfMonth: fromParsed.dayOfMonth,
    };
  }

  if (fromParsed.year !== toParsed.year) return undefined;
  const year = fromParsed.year;

  // Full year: Jan 1 → Dec 31
  if (
    fromParsed.monthIndex === 0 &&
    fromParsed.dayOfMonth === 1 &&
    toParsed.monthIndex === 11 &&
    toParsed.dayOfMonth === 31
  ) {
    return { kind: 'year', year };
  }

  // Full month: first day → last day of the same month
  if (
    fromParsed.monthIndex === toParsed.monthIndex &&
    fromParsed.dayOfMonth === 1 &&
    toParsed.dayOfMonth === new Date(year, toParsed.monthIndex + 1, 0).getDate()
  ) {
    const key = formatMonthKey(year, fromParsed.monthIndex);
    return { kind: 'month', key, year, monthIndex: fromParsed.monthIndex };
  }

  return undefined;
}

function selectionFromPeriod(period: TemporalMosaicPeriod): TemporalMosaicSelection | undefined {
  if (period.kind === 'year') return undefined;
  return { kind: period.kind, key: period.key };
}

function labelForSelectedPeriod(period?: TemporalMosaicPeriod): string | undefined {
  if (!period || period.kind === 'year') return undefined;
  if (period.kind === 'month') {
    return MONTH_BADGE_FORMATTER.format(new Date(period.year, period.monthIndex, 1));
  }
  return DAY_BADGE_FORMATTER.format(new Date(period.year, period.monthIndex, period.dayOfMonth));
}

function filterByPeriod(items: ActivityItem[], period: TemporalMosaicPeriod): ActivityItem[] {
  if (period.kind === 'year') return items;
  return items.filter((item) => timestampInPeriod(activityDateTime(item), period));
}

function emptyTitle(filter: ActivityFilter, period?: TemporalMosaicPeriod): string {
  const noun = activityFilterLabel(filter);
  if (!period) return `No ${noun}`;
  if (period.kind === 'day') return `No ${noun} on this day`;
  if (period.kind === 'month') return `No ${noun} in this month`;
  return `No ${noun} in this year`;
}

function activityFilterLabel(filter: ActivityFilter): string {
  if (filter === 'post') return 'posts';
  if (filter === 'comment') return 'comments';
  if (filter === 'content') return 'content';
  if (filter === 'reaction') return 'reactions';
  if (filter === 'repost') return 'reposts';
  if (filter === 'rich-media') return 'rich media';
  if (filter === 'connections') return 'connection activity';
  if (filter === 'engagement') return 'engagement';
  if (filter === 'job') return 'jobs';
  if (filter === 'job-applied') return 'applied jobs';
  if (filter === 'job-saved') return 'saved jobs';
  if (filter === 'ad') return 'ads';
  if (filter === 'misc') return 'misc activity';
  if (filter === 'saved-item') return 'saved items';
  if (filter === 'endorsement') return 'endorsements';
  if (filter === 'endorsement-given') return 'sent endorsements';
  if (filter === 'endorsement-received') return 'received endorsements';
  if (filter === 'account') return 'account events';
  if (filter === 'account-created') return 'account creation';
  if (filter === 'account-email-updates') return 'email updates';
  if (filter === 'receipts') return 'receipts';
  if (filter === 'security') return 'security events';
  if (filter === 'security-verifications') return 'security verifications';
  if (filter === 'security-logins') return 'logins';
  if (filter === 'security-challenges') return 'security challenges';
  if (filter === 'search') return 'searches';
  if (filter === 'message') return 'messages';
  if (filter === 'message-sent') return 'sent messages';
  if (filter === 'message-received') return 'received messages';
  if (filter === 'learning') return 'learning activity';
  if (filter === 'connection') return 'connections';
  if (filter === 'connection-imported') return 'imported contacts';
  if (filter === 'member-follow') return 'following';
  if (filter === 'company-follow') return 'pages';
  if (filter === 'hashtag-follow') return 'hashtags';
  if (filter === 'recommendations') return 'recommendations';
  if (filter === 'recommendation-given') return 'sent recommendations';
  if (filter === 'recommendation-received') return 'received recommendations';
  if (filter === 'invitation-sent') return 'sent connections';
  if (filter === 'invitation-received') return 'received connections';
  if (filter === 'event') return 'events';
  if (filter === 'vote') return 'poll votes';
  return 'activity';
}

function countByKind(items: ActivityItem[]): Record<ActivityFilter, number> {
  const initial = {
    all: 0,
    post: 0,
    comment: 0,
    'rich-media': 0,
    content: 0,
    reaction: 0,
    repost: 0,
    connections: 0,
    engagement: 0,
    job: 0,
    'job-applied': 0,
    'job-saved': 0,
    ad: 0,
    misc: 0,
    'saved-item': 0,
    endorsement: 0,
    'endorsement-given': 0,
    'endorsement-received': 0,
    account: 0,
    'account-created': 0,
    'account-email-updates': 0,
    receipts: 0,
    security: 0,
    'security-verifications': 0,
    'security-logins': 0,
    'security-challenges': 0,
    search: 0,
    message: 0,
    'message-sent': 0,
    'message-received': 0,
    learning: 0,
    connection: 0,
    'connection-imported': 0,
    'member-follow': 0,
    'company-follow': 0,
    'hashtag-follow': 0,
    recommendations: 0,
    'recommendation-given': 0,
    'recommendation-received': 0,
    'invitation-sent': 0,
    'invitation-received': 0,
    event: 0,
    vote: 0,
  } as Record<ActivityFilter, number>;
  return items.reduce((counts, item) => {
    counts.all += 1;
    counts[item.kind] = (counts[item.kind] ?? 0) + 1;
    if (item.kind === 'post' || item.kind === 'comment' || item.kind === 'rich-media') {
      counts.content += 1;
    }
    if (
      item.kind === 'reaction' ||
      item.kind === 'vote' ||
      item.kind === 'repost' ||
      item.kind === 'member-follow' ||
      item.kind === 'company-follow' ||
      item.kind === 'hashtag-follow' ||
      item.kind === 'saved-item' ||
      item.kind === 'event'
    ) {
      counts.engagement += 1;
    }
    if (
      item.kind === 'connection' ||
      item.kind === 'invitation-sent' ||
      item.kind === 'invitation-received' ||
      item.subtype === 'connection-imported'
    ) {
      counts.connections += 1;
    }
    if (item.kind === 'recommendation-given' || item.kind === 'recommendation-received') {
      counts.recommendations += 1;
    }
    if (
      item.kind === 'ad' ||
      item.kind === 'search' ||
      item.kind === 'learning' ||
      item.subtype === 'account-registration' ||
      item.subtype === 'account-receipt'
    ) {
      counts.misc += 1;
    }
    if (item.subtype === 'account-email-update') {
      counts.security += 1;
    }
    if (item.subtype === 'job-applied') counts['job-applied'] += 1;
    if (item.subtype === 'job-saved') counts['job-saved'] += 1;
    if (item.subtype === 'endorsement-given') counts['endorsement-given'] += 1;
    if (item.subtype === 'endorsement-received') counts['endorsement-received'] += 1;
    if (item.subtype === 'account-registration') counts['account-created'] += 1;
    if (item.subtype === 'account-email-update') counts['account-email-updates'] += 1;
    if (item.subtype === 'account-receipt') counts.receipts += 1;
    if (item.subtype === 'message-sent') counts['message-sent'] += 1;
    if (item.subtype === 'message-received') counts['message-received'] += 1;
    if (item.subtype === 'security-verification') counts['security-verifications'] += 1;
    if (item.subtype === 'security-login') counts['security-logins'] += 1;
    if (item.subtype === 'security-challenge') counts['security-challenges'] += 1;
    if (item.subtype === 'connection-imported') counts['connection-imported'] += 1;
    return counts;
  }, initial);
}

function matchesActivityFilter(item: ActivityItem, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'content') {
    return item.kind === 'post' || item.kind === 'comment' || item.kind === 'rich-media';
  }
  if (filter === 'engagement') {
    return (
      item.kind === 'reaction' ||
      item.kind === 'vote' ||
      item.kind === 'repost' ||
      item.kind === 'member-follow' ||
      item.kind === 'company-follow' ||
      item.kind === 'hashtag-follow' ||
      item.kind === 'saved-item' ||
      item.kind === 'event'
    );
  }
  if (filter === 'connections') {
    return (
      item.kind === 'connection' ||
      item.kind === 'invitation-sent' ||
      item.kind === 'invitation-received' ||
      item.subtype === 'connection-imported'
    );
  }
  if (filter === 'connection-imported') return item.subtype === 'connection-imported';
  if (filter === 'recommendations') {
    return item.kind === 'recommendation-given' || item.kind === 'recommendation-received';
  }
  if (filter === 'job-applied') return item.subtype === 'job-applied';
  if (filter === 'job-saved') return item.subtype === 'job-saved';
  if (filter === 'misc') {
    return (
      item.kind === 'ad' ||
      item.kind === 'search' ||
      item.kind === 'learning' ||
      item.subtype === 'account-registration' ||
      item.subtype === 'account-receipt'
    );
  }
  if (filter === 'security') {
    return (
      item.kind === 'security' ||
      item.subtype === 'security-login' ||
      item.subtype === 'security-challenge' ||
      item.subtype === 'security-verification' ||
      item.subtype === 'account-email-update'
    );
  }
  if (filter === 'endorsement-given') return item.subtype === 'endorsement-given';
  if (filter === 'endorsement-received') return item.subtype === 'endorsement-received';
  if (filter === 'account-created') return item.subtype === 'account-registration';
  if (filter === 'account-email-updates') return item.subtype === 'account-email-update';
  if (filter === 'receipts') return item.subtype === 'account-receipt';
  if (filter === 'message-sent') return item.subtype === 'message-sent';
  if (filter === 'message-received') return item.subtype === 'message-received';
  if (filter === 'security-verifications') return item.subtype === 'security-verification';
  if (filter === 'security-logins') return item.subtype === 'security-login';
  if (filter === 'security-challenges') return item.subtype === 'security-challenge';
  return item.kind === filter;
}
