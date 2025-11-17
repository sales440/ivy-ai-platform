import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { callDataApi } from "./_core/dataApi";
import * as db from "./db";

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
      seniority: z.string().optional(),
      skills: z.array(z.string()).optional(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Build search keywords from query and filters
        let searchKeywords = input.query;
        if (input.industry) {
          searchKeywords += ` ${input.industry}`;
        }
        if (input.seniority) {
          searchKeywords += ` ${input.seniority}`;
        }
        if (input.skills && input.skills.length > 0) {
          searchKeywords += ` ${input.skills.join(' ')}`;
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
        
         // Log search to database for analytics
        let searchId: number | undefined;
        if (ctx.user) {
          searchId = await db.createProspectSearch({
            userId: ctx.user.id,
            companyId: ctx.user.companyId || null,
            query: input.query,
            industry: input.industry || null,
            location: input.location || null,
            companySize: input.companySize || null,
            seniority: input.seniority || null,
            skills: input.skills ? input.skills.join(', ') : null,
            resultCount: searchResult.data.total || prospects.length,
            source: 'linkedin',
          });
        }
        
        return {
          success: true,
          prospects,
          total: searchResult.data.total || prospects.length,
          source: 'linkedin',
          searchId,
        };;
        
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
      linkedinUsername: z.string().optional(),
      linkedinUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Extract username from LinkedIn URL if provided
        let username = input.linkedinUsername;
        if (!username && input.linkedinUrl) {
          const urlMatch = input.linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
          if (urlMatch) {
            username = urlMatch[1];
          }
        }

        if (!username) {
          return {
            success: false,
            message: "LinkedIn username or URL is required",
            data: null,
          };
        }

        console.log('[Ivy-Prospect] Enriching profile for username:', username);

        // Call LinkedIn profile API
        const profileResult = await callDataApi('LinkedIn/get_user_profile_by_username', {
          query: { username }
        });

        if (!profileResult || !profileResult.id) {
          console.warn('[Ivy-Prospect] LinkedIn API returned no profile data');
          return {
            success: false,
            message: "Failed to fetch LinkedIn profile",
            data: null,
          };
        }

        // Extract enriched data from profile
        const enrichedData = {
          // Basic info
          firstName: profileResult.firstName || '',
          lastName: profileResult.lastName || '',
          headline: profileResult.headline || '',
          summary: profileResult.summary || '',
          location: profileResult.geo?.full || '',
          profilePicture: profileResult.profilePicture || '',
          linkedinUrl: `https://linkedin.com/in/${username}`,
          
          // Skills (top 10 by endorsements)
          skills: (profileResult.skills || [])
            .sort((a: any, b: any) => (b.endorsementsCount || 0) - (a.endorsementsCount || 0))
            .slice(0, 10)
            .map((skill: any) => ({
              name: skill.name,
              endorsements: skill.endorsementsCount || 0,
            })),
          
          // Experience (current and previous positions)
          experience: (profileResult.position || []).map((pos: any) => ({
            title: pos.title || '',
            company: pos.companyName || '',
            companyLinkedin: pos.companyURL || '',
            startDate: pos.start ? `${pos.start.year}-${pos.start.month || 1}` : '',
            endDate: pos.end && pos.end.year ? `${pos.end.year}-${pos.end.month || 1}` : 'Present',
            description: pos.description || '',
          })),
          
          // Education
          education: (profileResult.educations || []).map((edu: any) => ({
            school: edu.schoolName || '',
            degree: edu.degree || '',
            field: edu.fieldOfStudy || '',
            startYear: edu.start?.year || null,
            endYear: edu.end?.year || null,
          })),
          
          // Languages
          languages: (profileResult.languages || []).map((lang: any) => lang.name),
          
          // Badges
          badges: {
            isTopVoice: profileResult.isTopVoice || false,
            isCreator: profileResult.isCreator || false,
            isPremium: profileResult.isPremium || false,
          },
        };

        console.log('[Ivy-Prospect] Successfully enriched profile');

        return {
          success: true,
          message: "Profile enriched successfully",
          data: enrichedData,
        };
        
      } catch (error) {
        console.error('[Ivy-Prospect] Error enriching profile:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: null,
        };
      }
    }),
});
