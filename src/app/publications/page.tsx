import { BookOpen, Newspaper, Download, Eye, Calendar, Users, FileText, ArrowRight, Star, Award, Globe, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BridgesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24">
        <div className="absolute inset-0">
          <img
            src="https://placehold.co/1920x1080"
            alt="BRIDGES Publication Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            BRIDGES
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto font-medium drop-shadow-md">
            ARSA&apos;s official publication - connecting dorm residents through stories, insights, and community voices.
          </p>
        </div>
      </section>

      {/* BRIDGES Overview Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What is BRIDGES?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              BRIDGES is ARSA&apos;s flagship publication that serves as a bridge between dorm residents, 
              sharing stories, news, and insights that strengthen our community bonds.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community Stories</h3>
                <p className="text-muted-foreground">
                  Personal narratives, dorm life experiences, and resident spotlights that showcase our diverse community.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Newspaper className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Dorm News</h3>
                <p className="text-muted-foreground">
                  Updates on ARSA events, policy changes, and important announcements affecting dorm residents.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Student Voices</h3>
                <p className="text-muted-foreground">
                  Opinion pieces, creative writing, and student perspectives on campus life and current issues.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Digital Transition Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">From Paper to Digital</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  BRIDGES has evolved from its traditional paper format to embrace the digital age, 
                  making our publication more accessible and environmentally friendly.
                </p>
                <p>
                  While we maintain the quality and depth of our content, the digital format allows us 
                  to reach more residents, publish more frequently, and include multimedia elements.
                </p>
                <p>
                  Our transition reflects ARSA&apos;s commitment to innovation and sustainability, 
                  ensuring BRIDGES remains relevant in today&apos;s digital world.
                </p>
              </div>
            </div>
            <div className="bg-background rounded-lg p-8 shadow-sm border">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <Globe className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">Digital First</h3>
                  <p className="text-sm text-muted-foreground">Online Publication</p>
                </div>
                <div className="text-center">
                  <Smartphone className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">Mobile Ready</h3>
                  <p className="text-sm text-muted-foreground">Read Anywhere</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">Monthly Issues</h3>
                  <p className="text-sm text-muted-foreground">Regular Updates</p>
                </div>
                <div className="text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">Open to All</h3>
                  <p className="text-sm text-muted-foreground">Resident Contributions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Get Involved with BRIDGES</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you want to contribute content, share your story, or simply stay updated, 
            BRIDGES welcomes your participation in building our community narrative.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submit Your Story
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Read Latest Issue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Publication Archive Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">BRIDGES Archive</h2>
            <p className="text-lg text-muted-foreground">
              Explore our collection of past issues and discover the stories that have shaped our dorm community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Issues */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary">Latest</Badge>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">December 2024</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Holiday edition featuring winter activities, year-end reflections, and community highlights.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Issue
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge>November 2024</Badge>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Fall Semester Special</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mid-semester updates, academic resources, and student success stories.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Issue
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge>October 2024</Badge>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome Issue</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  New resident orientation, ARSA introduction, and getting started guide.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Issue
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Full Archive
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
