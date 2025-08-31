import { Mail, Users, Award, Calendar } from "lucide-react"

export default function AboutPage() {
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
              About ARSA
            </h1>
            <p className="text-xl text-white max-w-3xl mx-auto font-medium drop-shadow-md">
              The Ateneo Resident Students Association - your home away from home, 
              building community and fostering connections among dorm residents.
            </p>
          </div>
        </div>
      </section>

      {/* What is ARSA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                What is ARSA?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  ARSA (Ateneo Resident Students Association) is the official student 
                  organization representing all residents of the Ateneo dormitories. 
                  We serve as the voice of dorm residents and work to enhance the 
                  living experience on campus.
                </p>
                <p>
                  Our mission is to create a supportive, inclusive community where 
                  every resident feels at home. We organize events, provide resources, 
                  and ensure that dorm life is enriching and enjoyable for all students.
                </p>
                <p>
                  Through various programs and initiatives, we help residents connect 
                  with each other, develop leadership skills, and make the most of 
                  their university experience.
                </p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">500+</h3>
                  <p className="text-sm text-muted-foreground">Active Residents</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">50+</h3>
                  <p className="text-sm text-muted-foreground">Events Yearly</p>
                </div>
                <div className="text-center">
                  <Award className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">25+</h3>
                  <p className="text-sm text-muted-foreground">Years of Service</p>
                </div>
                <div className="text-center">
                  <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">24/7</h3>
                  <p className="text-sm text-muted-foreground">Support Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Council & Directory Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Council & Directory
            </h2>
            <p className="text-lg text-muted-foreground">
              Meet the dedicated students who lead ARSA and serve our dorm community
            </p>
          </div>

          {/* Council Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* President */}
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">President</h3>
                <p className="text-sm text-muted-foreground mb-3">John Doe</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">president@arsa.edu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vice President */}
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Vice President</h3>
                <p className="text-sm text-muted-foreground mb-3">Jane Smith</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">vp@arsa.edu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secretary */}
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Secretary</h3>
                <p className="text-sm text-muted-foreground mb-3">Mike Johnson</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">secretary@arsa.edu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Treasurer */}
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Treasurer</h3>
                <p className="text-sm text-muted-foreground mb-3">Sarah Wilson</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">treasurer@arsa.edu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Events Coordinator */}
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Events Coordinator</h3>
                <p className="text-sm text-muted-foreground mb-3">Alex Brown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">events@arsa.edu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Communications Officer */}
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Communications</h3>
                <p className="text-sm text-muted-foreground mb-3">Taylor Davis</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">comms@arsa.edu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Have questions about ARSA or need to reach our team?
            </p>
            <div className="bg-muted/50 rounded-lg p-8">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  For general inquiries, grievance forms, maintenance requests, or any other concerns, 
                  we&apos;re here to help you with all aspects of dorm life.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>arsa.college.org@student.ateneo.edu</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Visit our Contact page for detailed contact information, grievance forms, and more ways to reach us.
                </p>
                <div className="pt-4">
                  <a 
                    href="/contact" 
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
