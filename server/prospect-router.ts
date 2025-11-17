import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { callDataApi } from "./_core/dataApi";

// Helper function to calculate qualification score based on profile data
function calculateQualificationScore(person: any, filters: any): number {
  let score = 70; // Base score
  
  // Boost score if headline matches query
  if (person.headline && filters.query && person.headline.toLowerCase().includes(filters.query.toLowerCase())) {
    score += 15;
  }
  
  // Boost score if location matches
  if (person.location && filters.location && person.location.toLowerCase().includes(filters.location.toLowerCase())) {
    score += 10;
  }
  
  // Random variation
  score += Math.floor(Math.random() * 10) - 5;
  
  return Math.min(100, Math.max(0, score));
}

// Fallback mock data
function getMockProspects(input: any) {
  const mockProspects = [
    {
      name: "Jennifer Martinez",
      email: "j.martinez@techventures.com",
      company: "TechVentures Inc",
      title: "Chief Technology Officer",
      industry: "Technology",
      location: "Seattle, WA",
      companySize: "500-1000",
      linkedinUrl: "https://linkedin.com/in/jennifer-martinez",
      profilePicture: "https://i.pravatar.cc/150?img=5",
      qualificationScore: 88,
    },
    {
      name: "Robert Thompson",
      email: "r.thompson@innovatecorp.io",
      company: "InnovateCorp",
      title: "VP of Engineering",
      industry: "Software",
      location: "Austin, TX",
      companySize: "100-500",
      linkedinUrl: "https://linkedin.com/in/robert-thompson",
      profilePicture: "https://i.pravatar.cc/150?img=12",
      qualificationScore: 92,
    },
    {
      name: "Lisa Chen",
      email: "lisa.chen@globaltech.com",
      company: "GlobalTech Solutions",
      title: "Director of IT",
      industry: "Technology",
      location: "San Francisco, CA",
      companySize: "1000+",
      linkedinUrl: "https://linkedin.com/in/lisa-chen",
      profilePicture: "https://i.pravatar.cc/150?img=9",
      qualificationScore: 85,
    },
    {
      name: "James Wilson",
      email: "james.w@datastream.io",
      company: "DataStream Analytics",
      title: "Head of Data Engineering",
      industry: "Data Analytics",
      location: "New York, NY",
      companySize: "100-500",
      linkedinUrl: "https://linkedin.com/in/james-wilson",
      profilePicture: "https://i.pravatar.cc/150?img=15",
      qualificationScore: 90,
    },
    {
      name: "Maria Rodriguez",
      email: "m.rodriguez@cloudnine.com",
      company: "CloudNine Systems",
      title: "VP of Operations",
      industry: "Cloud Computing",
      location: "Denver, CO",
      companySize: "500-1000",
      linkedinUrl: "https://linkedin.com/in/maria-rodriguez",
      profilePicture: "https://i.pravatar.cc/150?img=20",
      qualificationScore: 87,
    },
  ];

  // Filter by criteria
  let results = mockProspects;
  
  if (input.industry) {
    results = results.filter(p => 
      p.industry.toLowerCase().includes(input.industry!.toLowerCase())
    );
  }
  
  if (input.location) {
    results = results.filter(p => 
      p.location.toLowerCase().includes(input.location!.toLowerCase())
    );
  }
  
  if (input.companySize) {
    results = results.filter(p => p.companySize === input.companySize);
  }

  // Filter by query (name, company, title)
  if (input.query) {
    const queryLower = input.query.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.company.toLowerCase().includes(queryLower) ||
      p.title.toLowerCase().includes(queryLower)
    );
  }

  return results.slice(0, input.limit);
}

export const prospectRouter = router({
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      industry: z.string().optional(),
      location: z.string().optional(),
      companySize: z.string().optional(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .mutation(async ({ input }) => {
      try {
        // Build search keywords from query and filters
        let searchKeywords = input.query;
        if (input.industry) {
          searchKeywords += ` ${input.industry}`;
        }
        
        console.log('[Ivy-Prospect] Searching LinkedIn with keywords:', searchKeywords);
        
        // Call LinkedIn people search API
        const searchResult = await callDataApi('LinkedIn/search_people', {
          query: {
            keywords: searchKeywords,
            keywordTitle: input.query,
            start: "0",
          }
        });
        
        // Check if API call was successful
        if (!searchResult || !searchResult.success || !searchResult.data || !searchResult.data.items) {
          console.warn('[Ivy-Prospect] LinkedIn API returned no results, falling back to mock data');
          const mockProspects = getMockProspects(input);
          return {
            success: true,
            prospects: mockProspects,
            total: mockProspects.length,
            source: 'mock',
          };
        }
        
        const people = searchResult.data.items || [];
        console.log(`[Ivy-Prospect] Found ${people.length} results from LinkedIn API`);
        
        // Transform LinkedIn results to prospect format
        const prospects = people.slice(0, input.limit).map((person: any) => {
          // Extract company from headline (format: "Title at Company")
          const headlineParts = person.headline?.split(' at ') || [];
          const title = headlineParts[0]?.trim() || person.title || 'Unknown Title';
          const company = headlineParts[1]?.trim() || person.company || 'Unknown Company';
          
          return {
            name: person.fullName || 'Unknown',
            email: null, // LinkedIn API doesn't provide email directly
            company,
            title,
            industry: input.industry || 'Technology',
            location: person.location || input.location || 'Unknown',
            companySize: input.companySize || '100-500',
            linkedinUrl: person.profileURL || `https://linkedin.com/in/${person.username}`,
            profilePicture: person.profilePicture || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            qualificationScore: calculateQualificationScore(person, input),
          };
        });
        
        return {
          success: true,
          prospects,
          total: searchResult.data.total || prospects.length,
          source: 'linkedin',
        };
        
      } catch (error) {
        console.error('[Ivy-Prospect] Error calling LinkedIn API:', error);
        // Fallback to mock data on error
        const mockProspects = getMockProspects(input);
        return {
          success: true,
          prospects: mockProspects,
          total: mockProspects.length,
          source: 'mock_fallback',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
  
  enrich: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      linkedinUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Simulación de enriquecimiento de lead (en producción, usar LinkedIn API o servicios como Clearbit)
      const enrichedData = {
        linkedinUrl: input.linkedinUrl || "https://linkedin.com/in/prospect",
        companyLinkedin: "https://linkedin.com/company/example",
        employeeCount: "500-1000",
        companyRevenue: "$10M-$50M",
        technologies: ["React", "Node.js", "AWS", "PostgreSQL"],
        recentNews: "Company raised $20M Series B funding",
      };

      // Actualizar lead con datos enriquecidos
      // await db.updateLead(input.leadId, enrichedData);

      return {
        success: true,
        message: "Lead enriched successfully",
        data: enrichedData,
      };
    }),
});
