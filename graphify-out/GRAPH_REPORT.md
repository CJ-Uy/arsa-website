# Graph Report - .  (2026-06-19)

## Corpus Check
- Large corpus: 416 files · ~1,641,861 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1789 nodes · 4773 edges · 90 communities (77 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Eventslug|Eventslug]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Pages|Pages]]
- [[_COMMUNITY_Checkout|Checkout]]
- [[_COMMUNITY_Db|Db]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Db|Db]]
- [[_COMMUNITY_Landing|Landing]]
- [[_COMMUNITY_Features|Features]]
- [[_COMMUNITY_Shop|Shop]]
- [[_COMMUNITY_Features|Features]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Landing|Landing]]
- [[_COMMUNITY_Lib|Lib]]
- [[_COMMUNITY_Captchas|Captchas]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Flower Fest 2026|Flower Fest 2026]]
- [[_COMMUNITY_Sso26|Sso26]]
- [[_COMMUNITY_Self Hosting Docs|Self Hosting Docs]]
- [[_COMMUNITY_Redirects|Redirects]]
- [[_COMMUNITY_Packages|Packages]]
- [[_COMMUNITY_Db|Db]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Events|Events]]
- [[_COMMUNITY_ARSAFEST FM A Prog Pubmats|ARSAFEST FM A Prog Pubmats]]
- [[_COMMUNITY_Lib|Lib]]
- [[_COMMUNITY_Main|Main]]
- [[_COMMUNITY_Orders|Orders]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Orders|Orders]]
- [[_COMMUNITY_Shop|Shop]]
- [[_COMMUNITY_STICKERS|STICKERS]]
- [[_COMMUNITY_ARSA2526 Brandbook|ARSA2526 Brandbook]]
- [[_COMMUNITY_Db|Db]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_App|App]]
- [[_COMMUNITY_Major Events|Major Events]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Faq|Faq]]
- [[_COMMUNITY_Lib|Lib]]
- [[_COMMUNITY_Gcashreaders|Gcashreaders]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Middleware|Middleware]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_STICKERS|STICKERS]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_Ui|Ui]]
- [[_COMMUNITY_ARSAFEST Lineup Square|ARSAFEST Lineup Square]]
- [[_COMMUNITY_Email Logs|Email Logs]]
- [[_COMMUNITY_Sso26|Sso26]]
- [[_COMMUNITY_Shop|Shop]]
- [[_COMMUNITY_ARSA2526 Brandbook|ARSA2526 Brandbook]]
- [[_COMMUNITY_ARSA2526 Event Brandbook Guidelines|ARSA2526 Event Brandbook Guidelines]]
- [[_COMMUNITY_Banner|Banner]]
- [[_COMMUNITY_Lib|Lib]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Lib|Lib]]
- [[_COMMUNITY_Slug|Slug]]
- [[_COMMUNITY_ARSA2526 Event Brandbook Guidelines|ARSA2526 Event Brandbook Guidelines]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Sso 2026|Sso 2026]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Lexend Deca|Lexend Deca]]
- [[_COMMUNITY_Lib|Lib]]
- [[_COMMUNITY_ARSA2526 Brandbook|ARSA2526 Brandbook]]
- [[_COMMUNITY_Flower Fest 2026|Flower Fest 2026]]
- [[_COMMUNITY_Images|Images]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Project Components|Project Components]]
- [[_COMMUNITY_Public|Public]]
- [[_COMMUNITY_Lib|Lib]]
- [[_COMMUNITY_Public|Public]]
- [[_COMMUNITY_Public|Public]]
- [[_COMMUNITY_Public|Public]]
- [[_COMMUNITY_Remember|Remember]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 240 edges
2. `Button()` - 90 edges
3. `db` - 71 edges
4. `Card()` - 66 edges
5. `CardContent()` - 66 edges
6. `auth` - 64 edges
7. `CardHeader()` - 54 edges
8. `CardTitle()` - 46 edges
9. `Badge()` - 45 edges
10. `Label()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `ARSA Website Platform Guidance` --semantically_similar_to--> `ARSA Website Platform`  [INFERRED] [semantically similar]
  CLAUDE.md → AGENTS.md
- `ARSA E-Commerce Platform` --semantically_similar_to--> `ARSA Website Platform`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `Edge Platform Migration` --semantically_similar_to--> `Cloudflare Platform Migration`  [INFERRED] [semantically similar]
  docs/Self Hosting Docs/CLOUDFLARE_MIGRATION.md → .remember/archive.md
- `Unified Event Umbrella Architecture` --conceptually_related_to--> `Shop Events System`  [INFERRED]
  .remember/recent.md → AGENTS.md
- `ContentPageRoute()` --calls--> `NotFound()`  [INFERRED]
  src/app/page/[slug]/page.tsx → src/app/not-found.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cloudflare Migration Record** — remember_archive_cloudflare_migration, remember_today_2026_05_20_done_prisma_to_drizzle, remember_today_2026_05_21_done_r2_consolidation, remember_today_2026_05_26_done_cloudflare_restoration, self_hosting_docs_cloudflare_migration_edge_platform_migration [EXTRACTED 1.00]
- **GCash Verification Workflow** — agents_gcash_ocr, self_hosting_docs_admin_orders_redesign_verification_workspace, self_hosting_docs_batch_ocr_guide_server_batch_ocr, self_hosting_docs_client_side_ocr_browser_batch_ocr [EXTRACTED 1.00]
- **Event Commerce Delivery Flow** — agents_shop_events_system, agents_delivery_and_stock, self_hosting_docs_custom_event_pages_custom_event_experience, self_hosting_docs_daily_stock_integration_daily_stock_dialog, self_hosting_docs_delivery_cutoff_setup_cutoff_scheduling [INFERRED 0.85]
- **GCash Receipt Verification Documentation** — self_hosting_docs_gcash_ocr_system_gcash_ocr_system, self_hosting_docs_implementation_summary_gcash_ocr_implementation_summary, self_hosting_docs_feature_guide_gcash_reference_number_feature, self_hosting_docs_pdf_image_support_image_and_pdf_receipt_support, self_hosting_docs_quick_reference_gcash_auto_extraction_quick_reference [INFERRED 0.95]
- **Docker Storage OCR Deployment Flow** — self_hosting_docs_docker_docker_deployment_guide, self_hosting_docs_minio_docker_config_minio_docker_network_configuration, self_hosting_docs_gcash_gcash_ocr_docker_fix, self_hosting_docs_production_deployment_production_deployment_notes, self_hosting_docs_deployment_steps_deployment_steps_for_ssl_fix [INFERRED 0.85]
- **Event Umbrella Architecture Delivery** — plans_2026_05_27_event_umbrella_architecture_event_umbrella_implementation_plan, specs_2026_05_27_event_umbrella_architecture_design_event_umbrella_design_spec, specs_2026_05_27_event_umbrella_architecture_design_event_umbrella, specs_2026_05_27_event_umbrella_architecture_design_staged_cutover [EXTRACTED 1.00]
- **ARSA Core Brand System** — arsa2526_brandbook_3_arsa_logo_guidelines, arsa2526_brandbook_4_arsa_color_palette, arsa2526_brandbook_5_arsa_typography, arsa2526_brandbook_6_arsa_textures [EXTRACTED 1.00]
- **Event Brandbook Creation Flow** — arsa2526_event_brandbook_guidelines_4_event_theme, arsa2526_event_brandbook_guidelines_5_theme_inspiration, arsa2526_event_brandbook_guidelines_6_event_logo_guidelines, arsa2526_event_brandbook_guidelines_7_event_color_palette, arsa2526_event_brandbook_guidelines_8_event_typography, arsa2526_event_brandbook_guidelines_9_event_textures, arsa2526_event_brandbook_guidelines_10_sample_publications [EXTRACTED 1.00]
- **Home-Centered Event Identity** — arsa2526_brandbook_2_arsa_2526_vision, arsa2526_brandbook_8_arsa_motto, arsa2526_event_brandbook_guidelines_4_event_theme [INFERRED 0.85]
- **KulturARSA Booth Design Campaign** — kulturarsa_pubmat_1_kulturarsa_contest_overview, kulturarsa_pubmat_2_kulturarsa_application, kulturarsa_pubmat_3_kulturarsa_regions, kulturarsa_pubmat_4_kulturarsa_signup [EXTRACTED 1.00]
- **ARSAFest FM&A Programs** — arsafest_fm_a_prog_pubmats_bao_030126_bao_challenge, arsafest_fm_a_prog_pubmats_bingo_night_030226_bingo_night, arsafest_fm_a_prog_pubmats_flea_market_030326_flea_market, arsafest_fm_a_prog_pubmats_gimmicks_030326_arsafest_gimmicks, arsafest_fm_a_prog_pubmats_henna_030426_2_henna_rates [EXTRACTED 1.00]
- **ARSAFest Gimmicks Programs** — arsafest_fm_a_prog_pubmats_gimmicks_030326_2_marriage_booth, arsafest_fm_a_prog_pubmats_gimmicks_030326_4_friendship_bracelet_station, arsafest_fm_a_prog_pubmats_gimmicks_030326_6_karaoke_booth, arsafest_fm_a_prog_pubmats_gimmicks_030326_arsafest_gimmicks [EXTRACTED 1.00]
- **ARSAFest 2026 Culminight Performers** — arsafest_lineup_square_16_sugarcane, arsafest_lineup_square_17_noah_alejandre, arsafest_lineup_square_18_edsa_xxtra, arsafest_lineup_square_19_dree_yap, arsafest_lineup_square_20_arsa_dt, arsafest_lineup_square_21_arsaound, arsafest_performer_fb_cover_culminight_lineup [EXTRACTED 1.00]
- **SSO 2026 Merchandise Collection** — reveal_1_sso_merch_reveal, reveal_2_blue_sso_shirt, reveal_3_white_sso_shirt, reveal_4_dormers_experience_stickers, reveal_5_after_graduation_stickers [EXTRACTED 1.00]
- **After Graduation Life Milestones** — stickers_after_graduation_2_first_paycheck, stickers_after_graduation_3_first_bill, stickers_after_graduation_4_no_more_canvas_deadlines, stickers_after_graduation_5_considering_masters, stickers_after_graduation_6_moved_out, stickers_after_graduation_cv_sent [EXTRACTED 1.00]
- **Dormer Experience Sticker Series** — stickers_dormer_experience_2_last_balikbayan_box_sticker, stickers_dormer_experience_3_cat_attacked_order_sticker, stickers_dormer_experience_4_coffee_buns_sticker, stickers_dormer_experience_5_dorm_speakers_sticker, stickers_dormer_experience_6_laundry_sticker, stickers_dormer_experience_first_bill_sticker [INFERRED 0.95]
- **Senior Send-Off 2026 T-Shirt Variants** — tshirt_mockup_back_blue_senior_sendoff_back_design, tshirt_mockup_back_white_class_2026_back_design, tshirt_mockup_front_blue_adventure_front_design, tshirt_mockup_front_white_adventure_front_design [INFERRED 0.95]

## Communities (90 total, 13 thin omitted)

### Community 0 - "Project Dependencies"
Cohesion: 0.03
Nodes (75): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, better-auth, browser-image-compression, canvas-confetti, class-variance-authority, clsx (+67 more)

### Community 1 - "Eventslug"
Cohesion: 0.07
Nodes (68): eventLanding, addEventTicketVerifier(), authedUserId(), createCategory(), createPage(), deleteCategory(), deleteEventTickets(), deletePage() (+60 more)

### Community 2 - "Ui"
Cohesion: 0.08
Nodes (26): UnauthorizedProps, EventWithModules, Props, CopyButton(), CopyButtonProps, OrderNeedingVerification, Page, PagesListProps (+18 more)

### Community 3 - "Ui"
Cohesion: 0.05
Nodes (43): cn(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator(), CardAction() (+35 more)

### Community 4 - "Pages"
Cohesion: 0.08
Nodes (45): Banner, BannerManagementProps, CategoriesClient(), CategoriesClientProps, Category, ImageCropEditor(), InvoiceUpload(), ManualVerificationDashboard() (+37 more)

### Community 5 - "Checkout"
Cohesion: 0.09
Nodes (39): Grant, ROLES, SearchUser, CartItem, CheckoutClient(), CheckoutClientProps, CheckoutConfig, CheckoutField (+31 more)

### Community 6 - "Db"
Cohesion: 0.04
Nodes (42): BannerManagement(), account, accountRelations, banner, cartItem, cartItemRelations, contentPage, eventAdminRelations (+34 more)

### Community 7 - "Ui"
Cohesion: 0.07
Nodes (45): AdminNav(), AdminNavProps, AdminPageTitle(), getInitials(), groupItems(), iconMap, NavFooter(), NavItemDef (+37 more)

### Community 8 - "Ui"
Cohesion: 0.06
Nodes (36): Props, SeniorCombobox(), SSO26DdayClient(), toTitleCase(), VoteState, SSO26DdayPage(), CustomTableCell, CustomTableHeader (+28 more)

### Community 9 - "Db"
Cohesion: 0.08
Nodes (36): AdminsClient(), EventAdminsPage(), NotFound(), EventShopCategoriesPage(), event, eventCategory, eventPage, eventRoleGrant (+28 more)

### Community 10 - "Landing"
Cohesion: 0.07
Nodes (28): AboutManagement(), AboutContentPage(), { GET, POST }, BridgesManagement(), BridgesContentPage(), ContactManagement(), ContactContentPage(), eventAdmin (+20 more)

### Community 11 - "Features"
Cohesion: 0.08
Nodes (33): CaptchaEntry, CAPTCHAS, EmailLog, EmailLogsClientProps, EmailLogStats, GachaBanner(), gachaItems, ImageCropEditorProps (+25 more)

### Community 12 - "Shop"
Cohesion: 0.09
Nodes (37): CartClient(), CartClientProps, CartItem, CropPosition, Package, PackageItem, PackagePool, PackagePoolOption (+29 more)

### Community 13 - "Features"
Cohesion: 0.06
Nodes (24): HomePageClient(), HomePageClientProps, iconLookup, MajorEventSection(), HomePage(), FAQContentManagement(), AdminFAQContentPage(), FAQPage() (+16 more)

### Community 14 - "Project Components"
Cohesion: 0.06
Nodes (44): ARSA Website Platform, Cloudflare Workers Architecture, Delivery Scheduling and Daily Stock, GCash OCR and Verification, Google Sheets Synchronization, Product Package System, Role-Based Administration, Shop Events System (+36 more)

### Community 15 - "Landing"
Cohesion: 0.11
Nodes (25): AboutManagementProps, BridgesManagementProps, ContactManagementProps, DailyStockConfig, DailyStockDialogProps, DailyStockOverrides(), CropPosition, HomeContent (+17 more)

### Community 16 - "Lib"
Cohesion: 0.08
Nodes (32): emailLog, addManualEmailLog(), fetchEmailLogs(), removeEmailLog(), createResendClient(), EMAIL_THEMES, EmailProvider, EmailSettings (+24 more)

### Community 17 - "Captchas"
Cohesion: 0.08
Nodes (25): BalloonCaptchaModal(), CAPTCHA_COMPONENTS, CAPTCHA_TITLES, CAPTCHA_TYPES, CaptchaType, Props, BalloonSvg(), BalloonSvgProps (+17 more)

### Community 18 - "Ui"
Cohesion: 0.10
Nodes (27): getOrdersWithoutEmails(), OrderWithoutEmail, SendResult, DailyStockOverride, DailyStockOverridesProps, GenerateClient(), GenerateClientProps, Ticket (+19 more)

### Community 19 - "Flower Fest 2026"
Cohesion: 0.10
Nodes (29): FlowerFestCheckout(), createFlowerFestOrder(), DELIVERY_TIME_SLOTS, DeliveryInfo, DeliveryOption, FlowerFestOrderData, FulfillmentInfo, FulfillmentType (+21 more)

### Community 20 - "Sso26"
Cohesion: 0.15
Nodes (22): clearAllDdayVotes(), clearAllNominations(), deleteDdayVote(), deleteNomination(), getDdayResults(), getRawDdayVotes(), getRawNominations(), getSSO26Stats() (+14 more)

### Community 21 - "Self Hosting Docs"
Cohesion: 0.09
Nodes (30): Event Umbrella Architecture Implementation Plan, Deployment Steps for SSL Fix, Docker Deployment Guide, Composable E-Commerce Modules, E-Shop System Architecture, GCash Reference Number Feature, GCash OCR Docker Deployment Fix, Automated Payment Verification (+22 more)

### Community 22 - "Redirects"
Cohesion: 0.11
Nodes (27): redirectTagAssignment, assignTagsToRedirect(), checkRedirectsAdmin(), cleanupOldClicks(), ClickAnalytics, createRedirect(), createTag(), deleteRedirect() (+19 more)

### Community 23 - "Packages"
Cohesion: 0.10
Nodes (20): packageItem, packagePool, packagePoolOption, cache, cacheKeys, inflightRequests, createPackage(), CropPosition (+12 more)

### Community 24 - "Db"
Cohesion: 0.10
Nodes (17): ticket, ticketEvent, ticketVerifier, createHttpClient(), createNativeClient(), DbClient, globalForDb, resolveClient() (+9 more)

### Community 25 - "Ui"
Cohesion: 0.10
Nodes (18): CartCounter(), authClient, navigation, ThemeToggle(), Avatar(), AvatarFallback(), AvatarImage(), DropdownMenu() (+10 more)

### Community 26 - "Events"
Cohesion: 0.08
Nodes (19): eventComponents, CheckoutConfig, CheckoutField, CheckoutFieldType, CropPosition, EventAnimationProps, EventProduct, FieldCondition (+11 more)

### Community 27 - "ARSAFEST FM A Prog Pubmats"
Cohesion: 0.10
Nodes (22): ARSAFest Sidlak 2026, Kadang-Kadang sa Bao Registration Guidelines, Kadang-Kadang sa Bao Challenge, Bingo Night How to Play, ARSAFest Bingo Night, Flea Market General Information, Flea Market House Rules, Ukay Okay Flea Market (+14 more)

### Community 28 - "Lib"
Cohesion: 0.17
Nodes (17): shopSettings, CheckoutField, CheckoutFieldType, FieldCondition, getColumnName(), getGoogleSheetsClient(), getGoogleSheetsSettings(), getLastSyncTimestamp() (+9 more)

### Community 29 - "Main"
Cohesion: 0.12
Nodes (14): farmToMarket, geistMono, geistSans, gentlemensScript, metadata, Banner, LayoutWrapper(), LayoutWrapperProps (+6 more)

### Community 30 - "Orders"
Cohesion: 0.18
Nodes (14): GcashReceiptData, parseOcrText(), parseGcashReceiptClient(), ClientBatchOcr(), OrderForOcr, checkShopAdmin(), getAllOrdersWithReceipts(), getOrdersForClientOcr() (+6 more)

### Community 31 - "Project Components"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 32 - "Project Components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 33 - "Ui"
Cohesion: 0.14
Nodes (9): HoverCardContent(), ResizableHandle(), ResizablePanelGroup(), Slider(), ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle() (+1 more)

### Community 34 - "Project Components"
Cohesion: 0.11
Nodes (18): devDependencies, @cloudflare/workers-types, drizzle-kit, eslint, eslint-config-next, @eslint/eslintrc, prettier, prettier-plugin-tailwindcss (+10 more)

### Community 35 - "Ui"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 36 - "Orders"
Cohesion: 0.18
Nodes (11): order, sendBulkConfirmationEmails(), GCashTransaction, parseInvoiceTable(), getEmailSettings(), sendOrderConfirmationEmail(), checkShopAdmin(), getOrdersNeedingVerification() (+3 more)

### Community 37 - "Shop"
Cohesion: 0.13
Nodes (13): Session, CartItem, CropPosition, EventCategory, EventProduct, PackageItem, PackagePool, PackagePoolOption (+5 more)

### Community 38 - "STICKERS"
Cohesion: 0.13
Nodes (15): SSO 2026 Merchandise Reveal, Blue SSO Shirt, White SSO Shirt, Dormer's Experience Sticker Set, After Graduation Sticker Set, Friendship Bottle Cap, Ateneo Residence Halls Key Fob, Adventure Is Out There SSO 2026 Long Logo (+7 more)

### Community 39 - "ARSA2526 Brandbook"
Cohesion: 0.19
Nodes (14): ARSA Logo Guidelines, Logo Integrity, Official and Alternative ARSA Logos, ARSA Color Palette, ARSA Brand Colors, ARSA Typography, Avenir, Proxima Nova, Georgia Pro, and Lexend Deca, ARSA Publication Samples (+6 more)

### Community 40 - "Db"
Cohesion: 0.23
Nodes (10): packageTable, product, EventsListPage(), db, getUserAccessibleEvents(), AdminOrdersPage(), PackagesManagement(), AdminPackagesPage() (+2 more)

### Community 41 - "Ui"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 42 - "App"
Cohesion: 0.17
Nodes (7): ARSAFestClient(), EVENT_END, EVENT_START, EventPhase, IMAGES, schedule, useEventCountdown()

### Community 43 - "Major Events"
Cohesion: 0.17
Nodes (6): Balloon, BALLOON_COLORS, BalloonAnimation(), DORMER_STICKERS, GRAD_STICKERS, SSO_IMAGES

### Community 44 - "Ui"
Cohesion: 0.18
Nodes (10): buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps (+2 more)

### Community 45 - "Faq"
Cohesion: 0.23
Nodes (6): FAQPageClient(), FAQItem, Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 46 - "Lib"
Cohesion: 0.26
Nodes (8): GET(), BucketName, BUCKETS, deleteFile(), getBucket(), getFileStream(), uploadFile(), POST()

### Community 47 - "Gcashreaders"
Cohesion: 0.23
Nodes (7): columnBoundaries, ExtractedPages, GcashInvoiceExtractedData, GcashTransaction, parseGcashPdf(), PositionedTextItem, extractRefNumberFromPdf()

### Community 48 - "Project Components"
Cohesion: 0.17
Nodes (12): scripts, build, cf-typegen, db:generate, db:migrate, db:migrate:local, db:studio, deploy (+4 more)

### Community 49 - "Ui"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 50 - "Middleware"
Cohesion: 0.22
Nodes (8): redirectClick, redirects, redirectTag, redirectMiddleware(), Redirect, RedirectsPage(), config, middleware()

### Community 51 - "Project Components"
Cohesion: 0.25
Nodes (10): npx, filesystem, git, memory, postgres, prisma, @modelcontextprotocol/server-filesystem, @modelcontextprotocol/server-git (+2 more)

### Community 52 - "STICKERS"
Cohesion: 0.25
Nodes (11): Packed My Last Balikbayan Box Sticker, Cat Attacked My Grab Order Sticker, More Coffee Buns Sticker, Dorm Speakers Woke Me Up Sticker, Finally Did My Laundry Sticker, Dormer Experience Sticker Collection, First Bill Sticker, Blue Senior Send-Off 2026 Back Design (+3 more)

### Community 53 - "Ui"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 54 - "Ui"
Cohesion: 0.18
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 55 - "ARSAFEST Lineup Square"
Cohesion: 0.20
Nodes (10): ARSAFest Henna Tattoos by Hara Henna, Pancit Canton Competition Registration Guidelines, ARSAFest Pancit Canton Eating Competition, Sugarcane, Noah Alejandre, Edsa Xxtra, Dree Yap, ARSA DT (+2 more)

### Community 56 - "Email Logs"
Cohesion: 0.31
Nodes (8): BulkSendClient(), EmailLogsClient(), EmailLogsPage(), getEmailLogStats(), Tabs(), TabsContent(), TabsList(), TabsTrigger()

### Community 57 - "Sso26"
Cohesion: 0.25
Nodes (8): sso26DdayVote, sso26Nomination, ALLOWED_DOMAINS, DdayVoteInput, NominationInput, submitDdayVotes(), submitNominations(), verifyAteneoUser()

### Community 58 - "Shop"
Cohesion: 0.33
Nodes (7): withCache(), getActiveEvents(), getPackages(), getProducts(), ARSAShopPage(), metadata, ShopClient()

### Community 59 - "ARSA2526 Brandbook"
Cohesion: 0.29
Nodes (8): Approachable, Competent, Visible Council, ARSA 2526 Vision, Context, Inclusivity, Visibility, Competency, and Culture, In ARSA, It’s Good to Be Home, Home-Centered ARSA Identity, Dorm-as-Home Theme Requirement, Event Theme, Event Theme Inspiration

### Community 60 - "ARSA2526 Event Brandbook Guidelines"
Cohesion: 0.25
Nodes (8): ARSA Branding Resources, Templates and Blasting Protocols, Event Documentation Style, Photo Style Context for Documentation Teams, Full Event Collaterals List, Online, Physical, Video, Photo, and Calendar Outputs, Event Output Planning, Promotional and Documentation Channels

### Community 61 - "Banner"
Cohesion: 0.32
Nodes (5): createBanner(), deleteBanner(), parseManilaDatetime(), toggleBannerStatus(), updateBanner()

### Community 62 - "Lib"
Cohesion: 0.25
Nodes (3): BUCKETS, minioClient, minioPort

### Community 63 - "Project Components"
Cohesion: 0.25
Nodes (7): plugins, printWidth, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 65 - "Slug"
Cohesion: 0.33
Nodes (4): ContentRenderer(), ContentRendererProps, ContentPageRoute(), Props

### Community 66 - "ARSA2526 Event Brandbook Guidelines"
Cohesion: 0.33
Nodes (6): ARSA 2526 Brandbook Duplicate Cover, ARSA 2526 Brandbook, Event Brandbook Duplicate Cover, ARSA 2526 Event Brandbook Guidelines, Event Brandbook Overview, Prepublication Brand Approval

### Community 67 - "Project Components"
Cohesion: 0.33
Nodes (5): name, pnpm, onlyBuiltDependencies, private, version

### Community 68 - "Sso 2026"
Cohesion: 0.33
Nodes (3): Balloon, BALLOON_COLORS, SSOBalloonsAnimation()

### Community 69 - "Project Components"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 70 - "Lexend Deca"
Cohesion: 0.67
Nodes (3): Open Font Collaboration, SIL Open Font License 1.1, Lexend Deca Variable Font

## Knowledge Gaps
- **553 isolated node(s):** `@modelcontextprotocol/server-postgres`, `@modelcontextprotocol/server-filesystem`, `@modelcontextprotocol/server-memory`, `@modelcontextprotocol/server-git`, `useTabs` (+548 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Ui` to `Ui`, `Pages`, `Checkout`, `Ui`, `Ui`, `Features`, `Features`, `Landing`, `Ui`, `Ui`, `Orders`, `Ui`, `Ui`, `Shop`, `Ui`, `Ui`, `Faq`, `Ui`, `Ui`, `Ui`, `Email Logs`, `Shop`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `Button()` connect `Checkout` to `Eventslug`, `Ui`, `Ui`, `Pages`, `Ui`, `Ui`, `Db`, `Features`, `Shop`, `Features`, `Landing`, `Captchas`, `Ui`, `Sso26`, `Redirects`, `Ui`, `Main`, `Orders`, `Shop`, `Db`, `Ui`, `App`, `Major Events`, `Ui`, `Faq`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `db` connect `Db` to `Eventslug`, `Ui`, `Pages`, `Db`, `Ui`, `Db`, `Landing`, `Shop`, `Lib`, `Sso26`, `Redirects`, `Packages`, `Db`, `Lib`, `Main`, `Orders`, `Orders`, `Middleware`, `Email Logs`, `Sso26`, `Banner`, `Slug`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `@modelcontextprotocol/server-postgres`, `@modelcontextprotocol/server-filesystem`, `@modelcontextprotocol/server-memory` to the rest of the system?**
  _571 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.02666666666666667 - nodes in this community are weakly interconnected._
- **Should `Eventslug` be split into smaller, more focused modules?**
  _Cohesion score 0.06960385042576823 - nodes in this community are weakly interconnected._
- **Should `Ui` be split into smaller, more focused modules?**
  _Cohesion score 0.07981220657276995 - nodes in this community are weakly interconnected._