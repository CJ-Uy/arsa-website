import { BookOpen, FileText, Newspaper, Calendar, Users, Award, ExternalLink, Download, Eye, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PublicationsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              Publications
            </h1>
            <p className="text-xl text-white max-w-3xl mx-auto font-medium drop-shadow-md">
              Discover ARSA&apos;s official publications and literary works
            </p>
          </div>
        </div>
      </section>

      {/* Bridges Publication Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Bridges
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              The Official Publication of ARSA
            </p>
            <div className="flex justify-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                <Newspaper className="h-3 w-3 mr-1" />
                Official Publication
              </Badge>
              <Badge variant="outline" className="text-sm">
                <FileText className="h-3 w-3 mr-1" />
                Digital & Print
              </Badge>
            </div>
          </div>

          {/* Publication Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Connecting ARSA Through Words
              </h3>
              <p className="text-muted-foreground mb-6">
                Bridges has been ARSA&apos;s cornerstone publication since its inception, serving as a platform 
                for student voices, creative expression, and community storytelling. What began as a 
                traditional paper-only publication has now evolved into a comprehensive digital and print 
                experience, reaching more ARSA members than ever before.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Published quarterly</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Student-led editorial team</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Award-winning content</span>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <div className="w-32 h-32 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Current Issue</h4>
              <p className="text-muted-foreground mb-4">Volume 15, Issue 3</p>
              <Button className="w-full" asChild>
                <a href="#" className="flex items-center justify-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Read Online</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Evolution Timeline */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
              Evolution of Bridges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Newspaper className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Paper Era</CardTitle>
                  <CardDescription>1995 - 2020</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Traditional print publication distributed physically to ARSA members. 
                    Limited circulation but cherished as a tangible keepsake.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-primary/20">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Digital Transition</CardTitle>
                  <CardDescription>2020 - 2023</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Hybrid approach combining print and digital formats. 
                    Increased accessibility while maintaining traditional elements.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Digital-First</CardTitle>
                  <CardDescription>2023 - Present</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Modern digital platform with enhanced features. 
                    Wider reach, interactive content, and environmental sustainability.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Content Categories */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
              What We Publish
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Student Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Personal experiences, dorm life, and student perspectives
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Creative Writing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Poetry, short stories, and creative non-fiction
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Event Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ARSA events, activities, and community highlights
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Campus Life</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    University news, dorm updates, and student life
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-muted/30 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Get Involved with Bridges
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Whether you want to contribute content, join the editorial team, or simply stay 
              updated with ARSA&apos;s latest stories, there are many ways to be part of our 
              publication community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="#" className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Submit Your Work</span>
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#" className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Join Editorial Team</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Archive Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Publication Archive
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore our collection of past issues and special editions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Volume 15, Issue 3</span>
                  <Badge variant="secondary">Latest</Badge>
                </CardTitle>
                <CardDescription>Fall 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Features student stories, creative writing, and coverage of ARSA&apos;s 
                  latest community events.
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href="#" className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>Read</span>
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href="#" className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>PDF</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volume 15, Issue 2</CardTitle>
                <CardDescription>Summer 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Summer edition featuring vacation stories, internship experiences, 
                  and creative summer projects.
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href="#" className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>Read</span>
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href="#" className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>PDF</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volume 15, Issue 1</CardTitle>
                <CardDescription>Spring 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Spring awakening edition with new beginnings, academic insights, 
                  and community growth stories.
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href="#" className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>Read</span>
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href="#" className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>PDF</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <a href="#" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>View Full Archive</span>
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
