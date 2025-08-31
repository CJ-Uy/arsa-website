import { Calendar, Users, ArrowRight, BookOpen, FileText, Phone, Award, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EventCard } from "@/components/features/event-card"

// Mock data for upcoming events (will be replaced with Strapi CMS data)
const upcomingEvents = [
  {
    id: 1,
    title: "ARSA Welcome Night",
    date: "2024-12-15",
    time: "7:00 PM",
    location: "Common Room",
    description: "Join us for an evening of games, food, and getting to know your fellow ARSA residents!",
    attendees: 45,
    maxCapacity: 60,
    category: "Social",
    featured: true
  },
  {
    id: 2,
    title: "Study Hall Sessions",
    date: "2024-12-16",
    time: "6:00 PM",
    location: "Study Hall",
    description: "Group study sessions with free coffee and snacks. Perfect for finals prep!",
    attendees: 28,
    maxCapacity: 40,
    category: "Academic"
  },
  {
    id: 3,
    title: "Movie Night: Holiday Classics",
    date: "2024-12-17",
    time: "8:00 PM",
    location: "Outdoor Area",
    description: "Bundle up and enjoy holiday movies under the stars with hot chocolate!",
    attendees: 35,
    maxCapacity: 50,
    category: "Entertainment"
  },
  {
    id: 4,
    title: "ARSA Council Meeting",
    date: "2024-12-18",
    time: "5:00 PM",
    location: "Conference Room",
    description: "Monthly council meeting. All residents welcome to attend and share ideas!",
    attendees: 15,
    maxCapacity: 30,
    category: "Community"
  }
]

// Mock data for quick stats
const communityStats = {
  totalResidents: 120,
  activeEvents: 8,
  thisMonth: 15,
  satisfactionRate: 94
}

export default function HomePage() {
  const featuredEvent = upcomingEvents.find(event => event.featured)
  const otherEvents = upcomingEvents.filter(event => !event.featured).slice(0, 3)



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Featured Event */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('https://placehold.co/1920x1080')"
            }}
          />
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 z-0 bg-black/60" />
        
        {/* Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">
                In ARSA, It&apos;s good to be home
              </h1>
              <p className="text-xl mb-8 drop-shadow-md">
                Welcome to your dorm community where every day brings new opportunities 
                to connect, learn, and grow together.
              </p>
                                                           <div className="flex flex-col sm:flex-row gap-4">
                                     <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                     <a href="/about" className="flex items-center">
                       <Users className="h-5 w-5 mr-2" />
                       Learn More
                     </a>
                   </Button>
                </div>
            </div>

                         {/* Featured Event Card */}
             {featuredEvent && (
               <EventCard event={featuredEvent} variant="featured" />
             )}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Upcoming Events
              </h2>
              <p className="text-lg text-muted-foreground">
                Don&apos;t miss out on what&apos;s happening in ARSA
              </p>
            </div>
                         <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
               <a href="#" className="flex items-center">
                 View All Events
                 <ArrowRight className="h-4 w-4 ml-2" />
               </a>
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

	  {/* Facebook Post Embeds Section */}
	  <section className="py-16">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-foreground mb-4">
                 Latest from Facebook
               </h2>
               <p className="text-lg text-muted-foreground">
                 Stay updated with our latest posts and announcements
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Facebook Post Embed 1 */}
               <div className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center mb-4">
                   <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                     <span className="text-white text-sm font-bold">f</span>
                   </div>
                   <div>
                     <p className="font-semibold text-card-foreground">ARSA Ateneo</p>
                     <p className="text-sm text-muted-foreground">2 hours ago</p>
                   </div>
                 </div>
                 
                 <div className="bg-muted/50 rounded-lg p-4 mb-4 text-center">
                   <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                     <p className="text-muted-foreground text-sm">Facebook Post Embed</p>
                   </div>
                 </div>
                 
                 <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                   Join us this weekend for the ARSA Welcome Night! Games, food, and new friendships await.
                 </p>
                 
                 <Button size="sm" className="w-full" asChild>
                   <a href="https://facebook.com/arsaateneo" target="_blank" rel="noopener noreferrer">
                     View on Facebook
                   </a>
                 </Button>
               </div>

               {/* Facebook Post Embed 2 */}
               <div className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center mb-4">
                   <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                     <span className="text-white text-sm font-bold">f</span>
                   </div>
                   <div>
                     <p className="font-semibold text-card-foreground">ARSA Ateneo</p>
                     <p className="text-sm text-muted-foreground">1 day ago</p>
                   </div>
                 </div>
                 
                 <div className="bg-muted/50 rounded-lg p-4 mb-4 text-center">
                   <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                     <p className="text-muted-foreground text-sm">Facebook Post Embed</p>
                   </div>
                 </div>
                 
                 <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                   Study Hall sessions are back! Free coffee and snacks every evening this week.
                 </p>
                 
                 <Button size="sm" className="w-full" asChild>
                   <a href="https://facebook.com/arsaateneo" target="_blank" rel="noopener noreferrer">
                     View on Facebook
                   </a>
                 </Button>
               </div>

               {/* Facebook Post Embed 3 */}
               <div className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center mb-4">
                   <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                     <span className="text-white text-sm font-bold">f</span>
                   </div>
                   <div>
                     <p className="font-semibold text-card-foreground">ARSA Ateneo</p>
                     <p className="text-sm text-muted-foreground">3 days ago</p>
                   </div>
                 </div>
                 
                 <div className="bg-muted/50 rounded-lg p-4 mb-4 text-center">
                   <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                     <p className="text-muted-foreground text-sm">Facebook Post Embed</p>
                   </div>
                 </div>
                 
                 <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                   Council meeting this Friday! All residents welcome to share ideas and concerns.
                 </p>
                 
                 <Button size="sm" className="w-full" asChild>
                   <a href="https://facebook.com/arsaateneo" target="_blank" rel="noopener noreferrer">
                     View on Facebook
                   </a>
                 </Button>
               </div>
             </div>
           </div>
         </section>

      {/* Quick Actions Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Quick Actions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need, just a click away
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Book Venue</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4">
                  Reserve spaces for your events and activities
                </p>
                <div className="mt-auto">
                  <Button size="sm" className="w-full" asChild>
                    <a href="/resources" className="flex items-center justify-center">
                      Book Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Report Issue</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4">
                  Let us know about maintenance or other concerns
                </p>
                <div className="mt-auto">
                  <Button size="sm" className="w-full" asChild>
                    <a href="/contact" className="flex items-center justify-center">
                      Report
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Read Bridges</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4">
                  Check out our latest publication
                </p>
                <div className="mt-auto">
                  <Button size="sm" className="w-full" asChild>
                    <a href="/publications" className="flex items-center justify-center">
                      Read Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Get Help</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4">
                  Contact us for immediate assistance
                </p>
                <div className="mt-auto">
                  <Button size="sm" className="w-full" asChild>
                    <a href="/contact" className="flex items-center justify-center">
                      Contact
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              ARSA Community
            </h2>
            <p className="text-lg text-muted-foreground">
              Building connections, one day at a time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {communityStats.totalResidents}
              </div>
              <p className="text-muted-foreground">Active Residents</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {communityStats.activeEvents}
              </div>
              <p className="text-muted-foreground">Events This Week</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {communityStats.thisMonth}
              </div>
              <p className="text-muted-foreground">Events This Month</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Star className="h-10 w-10 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {communityStats.satisfactionRate}%
              </div>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

    	{/* Relevant Publications & Materials Section */}
       <section className="py-16 bg-muted/30">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-foreground mb-4">
               Latest Publications & Materials
             </h2>
             <p className="text-lg text-muted-foreground">
               Stay updated with ARSA&apos;s latest announcements and resources
             </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <Card className="hover:shadow-lg transition-shadow">
               <CardHeader>
                 <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                   <FileText className="h-8 w-8 text-primary" />
                 </div>
                 <CardTitle className="text-center">Bridges Magazine</CardTitle>
               </CardHeader>
               <CardContent className="text-center">
                 <p className="text-sm text-muted-foreground mb-4">
                   Latest issue of our official publication
                 </p>
                 <Button size="sm" className="w-full" asChild>
                   <a href="/publications" className="flex items-center justify-center">
                     Read Now
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </a>
                 </Button>
               </CardContent>
             </Card>

             <Card className="hover:shadow-lg transition-shadow">
               <CardHeader>
                 <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                   <Calendar className="h-8 w-8 text-primary" />
                 </div>
                 <CardTitle className="text-center">Event Posters</CardTitle>
               </CardHeader>
               <CardContent className="text-center">
                 <p className="text-sm text-muted-foreground mb-4">
                   Download and share upcoming event materials
                 </p>
                 <Button size="sm" className="w-full" asChild>
                   <a href="#" className="flex items-center justify-center">
                     View Posters
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </a>
                 </Button>
               </CardContent>
             </Card>

             <Card className="hover:shadow-lg transition-shadow">
               <CardHeader>
                 <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                   <BookOpen className="h-8 w-8 text-primary" />
                 </div>
                 <CardTitle className="text-center">Resource Guides</CardTitle>
               </CardHeader>
               <CardContent className="text-center">
                 <p className="text-sm text-muted-foreground mb-4">
                   Essential guides for ARSA residents
                 </p>
                 <Button size="sm" className="w-full" asChild>
                   <a href="/resources" className="flex items-center justify-center">
                     Access Guides
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </a>
                 </Button>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>


         {/* Social Media Section */}
         <section className="py-16">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-foreground mb-4">
                 Follow ARSA
               </h2>
               <p className="text-lg text-muted-foreground">
                 Connect with us across all social media platforms
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Instagram */}
               <Card className="text-center hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                     <span className="text-white text-xl font-bold">IG</span>
                   </div>
                   <CardTitle>Instagram</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground mb-4">@arsaateneo</p>
                   <Button size="sm" className="w-full" asChild>
                     <a href="https://instagram.com/arsaateneo" target="_blank" rel="noopener noreferrer">
                       Follow
                     </a>
                   </Button>
                 </CardContent>
               </Card>

               {/* TikTok */}
               <Card className="text-center hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                     <span className="text-white text-xl font-bold">T</span>
                   </div>
                   <CardTitle>TikTok</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground mb-4">@arsaateneo</p>
                   <Button size="sm" className="w-full" asChild>
                     <a href="https://tiktok.com/@arsaateneo" target="_blank" rel="noopener noreferrer">
                       Follow
                     </a>
                   </Button>
                 </CardContent>
               </Card>

               {/* Facebook */}
               <Card className="text-center hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                     <span className="text-white text-xl font-bold">f</span>
                   </div>
                   <CardTitle>Facebook</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground mb-4">@arsaateneo</p>
                   <Button size="sm" className="w-full" asChild>
                     <a href="https://facebook.com/arsaateneo" target="_blank" rel="noopener noreferrer">
                       Follow
                     </a>
                   </Button>
                 </CardContent>
               </Card>
             </div>
           </div>
         </section>

       {/* Call to Action Section */}
       <section className="py-16 bg-muted/30">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <h2 className="text-3xl font-bold text-foreground mb-4">
             Ready to Get Involved?
           </h2>
           <p className="text-lg text-muted-foreground mb-8">
             Join our vibrant community and make the most of your ARSA experience. 
             There&apos;s always something happening, and we&apos;d love for you to be part of it!
           </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <a href="#" className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Browse Events
                </a>
              </Button>
                            <Button size="lg" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground" asChild>
                 <a href="/about" className="flex items-center">
                   <Users className="h-5 w-5 mr-2" />
                   Learn More
                 </a>
               </Button>
            </div>
         </div>
       </section>
    </div>
  )
}
