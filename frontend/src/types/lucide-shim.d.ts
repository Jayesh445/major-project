declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }
  
  export type Icon = FC<IconProps>;
  
  export const Bot: Icon;
  export const Menu: Icon;
  export const X: Icon;
  export const Moon: Icon;
  export const Sun: Icon;
  export const Link: Icon;
  export const ChevronRight: Icon;
  export const ShieldCheck: Icon;
  export const Zap: Icon;
  export const BarChart: Icon;
  export const Lock: Icon;
  export const Search: Icon;
  export const Star: Icon;
  export const ChevronLeft: Icon;
  export const Quote: Icon;
  export const CheckCircle: Icon;
  export const Crown: Icon;
  export const Building: Icon;
  export const Upload: Icon;
  export const Brain: Icon;
  export const Truck: Icon;
  export const BarChart3: Icon;
  export const ArrowRight: Icon;
  export const Play: Icon;
  export const Sparkles: Icon;
  export const TrendingUp: Icon;
  export const Shield: Icon;
  export const Github: Icon;
  export const Twitter: Icon;
  export const Linkedin: Icon;
  export const Mail: Icon;
  export const Globe: Icon;
  export const Cpu: Icon;
  export const CalendarIcon: Icon;
  export const TrendingDown: Icon;
  export const PieChart: Icon;
  export const Activity: Icon;
  export const RefreshCw: Icon;
  export const ShoppingCart: Icon;
  export const PanelLeftIcon: Icon;
  export const XIcon: Icon;
  export const CheckIcon: Icon;
  export const ChevronDownIcon: Icon;
  export const ChevronUpIcon: Icon;
  export const GripVerticalIcon: Icon;
  export const CircleIcon: Icon;
  export const ChevronRightIcon: Icon;
  export const MinusIcon: Icon;
  export const SearchIcon: Icon;
  export const ArrowLeft: Icon;
  export const MoreHorizontal: Icon;
  export const Bell: Icon;
  export const AlertTriangle: Icon;
  export const Info: Icon;
  export const AlertCircle: Icon;
  export const Users: Icon;
  export const FileText: Icon;
  export const LayoutDashboard: Icon;
  export const Settings: Icon;
  export const LogOut: Icon;
}

declare module '@vercel/analytics/next' {
  import { ReactNode } from 'react';
  export function Analytics(props: {
    beforeSend?: (event: any) => any;
    debug?: boolean;
    mode?: 'auto' | 'production' | 'development';
  }): ReactNode;
}
