import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  tools: {
    functionDeclarations: [
      {
        name: "getData",
        description: "Fetch product data from the database based on the query.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      },
      {
        name: "compareProducts",
        description: "Compare two products by searching for them by name, brand, or description. Use product names like 'motorcycle', 'kawasaki bike', 'Dell laptop', etc.",
        parameters: {
          type: "object",
          properties: {
            product1: { type: "string", description: "First product name, brand, or description to search for" },
            product2: { type: "string", description: "Second product name, brand, or description to search for" }
          },
          required: ["product1", "product2"]
        }
      }
    ]
  } as any
});

const SYSTEM_PROMPT = `
You are an AI shopping assistant.
- Respond normally to greetings (hi, hello).
- If the user asks about products like details, filters, recommendations → call the "getData" tool.
- If the user asks to compare two products → call the "compareProducts" tool with the product names/descriptions (e.g., "motorcycle" and "kawasaki", NOT IDs).
- NEVER answer product questions directly. ALWAYS use tools.
- After receiving tool results, provide a clear final answer.
`;

export async function runGetDataTool(query:string):Promise<string>{
    try {
        const supabase = await createSupabaseServerClient();
        const searchQuery = query.toLowerCase();
        
        // Build query with search and filters
        let dbQuery = supabase
            .from('products')
            .select('id, title, price, category, brand, discount_percentage, thumbnail, description')
            .limit(10);
        
        // Apply search if query contains text
        if (searchQuery) {
            dbQuery = dbQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
        }
        
        const { data: products, error } = await dbQuery;
        
        if (error) {
            console.error('Database error:', error);
            return `Error fetching products: ${error.message}`;
        }
        
        if (!products || products.length === 0) {
            return `No products found matching "${query}". Try a different search term or category.`;
        }
        
        // Format the results for the AI
        const formattedResults = products.map(p => {
            const discountedPrice = p.discount_percentage > 0 
                ? (p.price * (1 - p.discount_percentage / 100)).toFixed(2)
                : p.price?.toFixed(2) || '0.00';
            
            return `**${p.title || 'Unknown Product'}** (ID: ${p.id})
- Category: ${p.category || 'N/A'}
- Brand: ${p.brand || 'N/A'}
- Price: $${p.price || 0}${p.discount_percentage > 0 ? ` (${p.discount_percentage}% off - Now $${discountedPrice})` : ''}
- Description: ${p.description ? p.description.substring(0, 150) + '...' : 'No description available'}`;
        }).join('\n\n');
        
        return `Found ${products.length} product(s):\n\n${formattedResults}`;
    } catch (error: any) {
        console.error('runGetDataTool error:', error);
        return `Error: ${error.message}`;
    }
}
export async function runCompareProductsTool(product1Name:string, product2Name:string):Promise<string>{
    try {
        const supabase = await createSupabaseServerClient();
        
        // Search for first product by name/brand/description
        const searchQuery1 = product1Name.toLowerCase();
        const { data: results1, error: error1 } = await supabase
            .from('products')
            .select('id, title, price, category, brand, discount_percentage, stock, description, warranty_information, shipping_information, return_policy, thumbnail')
            .or(`title.ilike.%${searchQuery1}%,description.ilike.%${searchQuery1}%,brand.ilike.%${searchQuery1}%,category.ilike.%${searchQuery1}%`)
            .limit(1);
        
        // Search for second product by name/brand/description
        const searchQuery2 = product2Name.toLowerCase();
        const { data: results2, error: error2 } = await supabase
            .from('products')
            .select('id, title, price, category, brand, discount_percentage, stock, description, warranty_information, shipping_information, return_policy, thumbnail')
            .or(`title.ilike.%${searchQuery2}%,description.ilike.%${searchQuery2}%,brand.ilike.%${searchQuery2}%,category.ilike.%${searchQuery2}%`)
            .limit(1);
        
        if (error1 || error2) {
            console.error('Database error:', error1 || error2);
            return `Error fetching products: ${(error1 || error2)?.message}`;
        }
        
        if (!results1 || results1.length === 0) {
            return `Could not find any product matching "${product1Name}". Please try a different search term.`;
        }
        
        if (!results2 || results2.length === 0) {
            return `Could not find any product matching "${product2Name}". Please try a different search term.`;
        }
        
        const product1 = results1[0];
        const product2 = results2[0];
        
        // Check if same product was found
        if (product1.id === product2.id) {
            return `Both searches returned the same product: "${product1.title}". Please provide two different product names.`;
        }
        
        // Calculate discounted prices
        const price1 = product1.discount_percentage > 0 
            ? product1.price * (1 - product1.discount_percentage / 100)
            : product1.price;
        const price2 = product2.discount_percentage > 0 
            ? product2.price * (1 - product2.discount_percentage / 100)
            : product2.price;
        
        // Create comparison with proper format for frontend parsing
        const comparison = `Here's a comparison of the two products:

**${product1.title || 'Unknown Product'}** (ID: ${product1.id})
- Category: ${product1.category || 'N/A'}
- Brand: ${product1.brand || 'N/A'}
- Price: $${price1.toFixed(2)}${product1.discount_percentage > 0 ? ` (${product1.discount_percentage}% off, originally $${product1.price})` : ''}
- Stock: ${product1.stock || 0} units
- Description: ${product1.description ? product1.description.substring(0, 150) + '...' : 'No description available'}
${product1.warranty_information ? `- Warranty: ${product1.warranty_information}` : ''}

**${product2.title || 'Unknown Product'}** (ID: ${product2.id})
- Category: ${product2.category || 'N/A'}
- Brand: ${product2.brand || 'N/A'}
- Price: $${price2.toFixed(2)}${product2.discount_percentage > 0 ? ` (${product2.discount_percentage}% off, originally $${product2.price})` : ''}
- Stock: ${product2.stock || 0} units
- Description: ${product2.description ? product2.description.substring(0, 150) + '...' : 'No description available'}
${product2.warranty_information ? `- Warranty: ${product2.warranty_information}` : ''}

**Key Differences:**
- Price: ${price1 < price2 ? `${product1.title} is cheaper ($${price1.toFixed(2)} vs $${price2.toFixed(2)})` : price1 > price2 ? `${product2.title} is cheaper ($${price2.toFixed(2)} vs $${price1.toFixed(2)})` : 'Same price'}
- Availability: ${product1.title} (${product1.stock || 0} units) vs ${product2.title} (${product2.stock || 0} units)
`;
        
        return comparison;
    } catch (error: any) {
        console.error('runCompareProductsTool error:', error);
        return `Error: ${error.message}`;
    }
}



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages = [] } = body;

    // Build conversation history for Gemini
    const geminiMessages = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    ];

    // Convert frontend messages to Gemini format
    for (const msg of messages) {
      if (msg.role === "user") {
        geminiMessages.push({
          role: "user",
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === "assistant") {
        geminiMessages.push({
          role: "model",
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === "tool") {
        // Convert tool results to text format for history
        geminiMessages.push({
          role: "user",
          parts: [{ text: `[Tool result from ${msg.toolName}]: ${msg.content}` }],
        });
      }
    }

    // Generate response from Gemini
    const result = await model.generateContent({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.2,
      },
    });

    const response = result.response.candidates?.[0];

    if (response?.content?.parts) {
      // Check if Gemini wants to call a tool
      const functionCallPart = response.content.parts.find((part: any) => part.functionCall);
      
      if (functionCallPart?.functionCall) {
        const toolCall = functionCallPart.functionCall;
        let toolResult: string;

        // Execute the appropriate tool
        if (toolCall.name === "getData") {
          const query = (toolCall.args as any).query;
          toolResult = await runGetDataTool(query);
        } else if (toolCall.name === "compareProducts") {
          const { product1, product2 } = toolCall.args as any;
          toolResult = await runCompareProductsTool(product1, product2);
        } else {
          toolResult = "Unknown tool requested";
        }

        // Send tool result back to Gemini for final answer
        const followUpMessages = [
          ...geminiMessages,
          {
            role: "model",
            parts: [{ functionCall: toolCall }],
          },
          {
            role: "function",
            parts: [{ functionResponse: { name: toolCall.name, response: { result: toolResult } } }],
          },
        ];

        const finalResult = await model.generateContent({
          contents: followUpMessages,
          generationConfig: {
            temperature: 0.2,
          },
        });

        const finalResponse = finalResult.response.candidates?.[0];
        const finalText = finalResponse?.content?.parts?.find((part: any) => part.text)?.text || toolResult;

        return new Response(JSON.stringify({ answer: finalText }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // If no function call, return the text response directly
      const textPart = response.content.parts.find((part: any) => part.text);
      return new Response(JSON.stringify({ answer: textPart?.text || "No response" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ answer: "No response from AI" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}