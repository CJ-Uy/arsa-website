"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
	Loader2,
	ShoppingCart,
	Package,
	Gift,
	CalendarHeart,
	Megaphone,
	Mail,
	Settings,
	Shield,
	Ticket,
	Link2,
	FileText,
	DatabaseBackup,
	ChevronsUpDown,
	LogOut,
	Home,
	Moon,
	Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "@/lib/auth-client";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { HelpCircle, Users2, BookOpen, PhoneCall, FilePlus2, GraduationCap } from "lucide-react";

const iconMap = {
	orders: ShoppingCart,
	products: Package,
	packages: Gift,
	events: CalendarHeart,
	banner: Megaphone,
	email: Mail,
	settings: Settings,
	super: Shield,
	tickets: Ticket,
	redirects: Link2,
	content: FileText,
	home: Home,
	faq: HelpCircle,
	about: Users2,
	bridges: BookOpen,
	contact: PhoneCall,
	otherpages: FilePlus2,
	sso26: GraduationCap,
	backup: DatabaseBackup,
} as const;

export type NavItemDef = {
	href: string;
	label: string;
	iconKey: keyof typeof iconMap;
	group?: string;
};

type AdminNavProps = {
	items: NavItemDef[];
	user: {
		name: string | null;
		email: string | null;
		image: string | null;
	};
};

function getInitials(name?: string | null) {
	if (!name) return "U";
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function groupItems(items: NavItemDef[]) {
	const groups: { name: string | undefined; items: NavItemDef[] }[] = [];
	let current: (typeof groups)[0] | null = null;

	for (const item of items) {
		if (!current || current.name !== item.group) {
			current = { name: item.group, items: [item] };
			groups.push(current);
		} else {
			current.items.push(item);
		}
	}
	return groups;
}

function NavFooter({ user }: { user: AdminNavProps["user"] }) {
	const { isMobile } = useSidebar();
	const { theme, setTheme } = useTheme();

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<SidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={user.image || ""} alt={user.name || "User"} />
									<AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{user.name}</span>
									<span className="text-muted-foreground truncate text-xs">{user.email}</span>
								</div>
								<ChevronsUpDown className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
							side={isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
								{theme === "light" ? (
									<Moon className="mr-2 h-4 w-4" />
								) : (
									<Sun className="mr-2 h-4 w-4" />
								)}
								{theme === "light" ? "Dark Mode" : "Light Mode"}
							</DropdownMenuItem>
							<DropdownMenuItem asChild className="cursor-pointer">
								<Link href="/">
									<Home className="mr-2 h-4 w-4" />
									Back to Landing
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleSignOut}
								className="cursor-pointer text-red-600 focus:text-red-600"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarFooter>
	);
}

export function AdminNav({ items, user }: AdminNavProps) {
	const pathname = usePathname();
	const [loadingPath, setLoadingPath] = useState<string | null>(null);
	const groups = groupItems(items);

	const handleNavigate = (href: string) => {
		if (href !== pathname) {
			setLoadingPath(href);
		}
	};

	// Reset loading state when pathname changes
	if (loadingPath && pathname === loadingPath) {
		setLoadingPath(null);
	}

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild tooltip="ARSA Admin">
							<Link href="/">
								<div className="flex aspect-square size-8 items-center justify-center overflow-hidden">
									<img src="/images/logo.png" alt="ARSA Logo" className="size-8 object-contain" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">ARSA Admin</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{groups.map((group, groupIdx) => (
					<SidebarGroup key={group.name ?? groupIdx}>
						{group.name && <SidebarGroupLabel>{group.name}</SidebarGroupLabel>}
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => {
									const Icon = iconMap[item.iconKey];
									const isActive = pathname === item.href;
									const isLoading = loadingPath === item.href;

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
												<Link href={item.href} onClick={() => handleNavigate(item.href)}>
													{isLoading ? <Loader2 className="animate-spin" /> : <Icon />}
													<span>{item.label}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<NavFooter user={user} />

			<SidebarRail />
		</Sidebar>
	);
}

/** Displays the current page name in the header based on pathname */
export function AdminPageTitle({ items }: { items: NavItemDef[] }) {
	const pathname = usePathname();
	const currentItem = items.find(
		(item) => pathname === item.href || pathname.startsWith(item.href + "/"),
	);
	return <h1 className="text-lg font-semibold">{currentItem?.label ?? "Admin"}</h1>;
}
