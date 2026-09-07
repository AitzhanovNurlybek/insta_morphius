import {
  AirplaneTilt,
  Calculator,
  ArrowRight,
  Baby,
  Briefcase,
  Buildings,
  Camera,
  CaretRight,
  ChartPieSlice,
  Car,
  ChartLineUp,
  Check,
  Clock,
  Confetti,
  Eye,
  FileText,
  FilmSlate,
  FirstAidKit,
  ForkKnife,
  GraduationCap,
  Heart,
  House,
  Info,
  Kanban,
  Laptop,
  LinkSimple,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  Moon,
  PaperPlaneTilt,
  Package,
  Palette,
  Percent,
  PencilSimple,
  PersonSimpleRun,
  Play,
  Plus,
  Receipt,
  Scissors,
  SignOut,
  Sparkle,
  Sun,
  TShirt,
  Tray,
  Trophy,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";

/**
 * Иконки Phosphor вместо самодельных контуров и эмодзи.
 *
 * Эмодзи рисует операционная система: на Windows, iOS и Android один и тот же
 * экран выглядит по-разному, цвет не подчиняется теме, а скринридер читает
 * «человек-пилот». Иконка — часть интерфейса, а не картинка из чужого набора.
 *
 * Вес duotone по умолчанию: у него есть характер, в отличие от ровного контура,
 * которым выглядит любой сгенерированный интерфейс.
 */
const MAP: Record<string, PhosphorIcon> = {
  // навигация и действия
  home: House,
  users: UsersThree,
  inbox: Tray,
  board: Kanban,
  building: Buildings,
  plus: Plus,
  arrowRight: ArrowRight,
  caretRight: CaretRight,
  check: Check,
  clock: Clock,
  search: MagnifyingGlass,
  file: FileText,
  edit: PencilSimple,
  sparkle: Sparkle,
  link: LinkSimple,
  send: PaperPlaneTilt,
  logout: SignOut,
  info: Info,
  sun: Sun,
  moon: Moon,
  chart: ChartLineUp,
  money: Wallet,
  heart: Heart,
  play: Play,
  trophy: Trophy,
  megaphone: Megaphone,
  package: Package,
  calculator: Calculator,
  receipt: Receipt,
  percent: Percent,
  pie: ChartPieSlice,
  pin: MapPin,
  gift: Confetti,

  // этапы работы
  camera: Camera,
  scissors: Scissors,
  eye: Eye,
  clapper: FilmSlate,

  // ниши
  "niche-Food": ForkKnife,
  "niche-Fashion": TShirt,
  "niche-Beauty": Palette,
  "niche-Auto": Car,
  "niche-Lifestyle": Sparkle,
  "niche-Sport": PersonSimpleRun,
  "niche-Tech": Laptop,
  "niche-Travel": AirplaneTilt,
  "niche-Family": Baby,
  "niche-Health": FirstAidKit,
  "niche-Education": GraduationCap,
  "niche-Business": Briefcase,
};

export function Icon({
  name,
  size = 16,
  weight = "duotone",
  className = "",
}: {
  name: string;
  size?: number;
  weight?: IconWeight;
  className?: string;
}) {
  const Component = MAP[name] ?? Info;
  return <Component size={size} weight={weight} className={`shrink-0 ${className}`} />;
}

/** Иконка ниши по её названию — чтобы не городить условие на каждом экране. */
export function NicheIcon({ niche, size = 13 }: { niche: string; size?: number }) {
  return <Icon name={`niche-${niche}`} size={size} weight="fill" />;
}
