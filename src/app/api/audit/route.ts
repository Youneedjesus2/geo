import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.business_name || !body.city) {
      return NextResponse.json(
        { status: "error", message: "Missing business_name or city" },
        { status: 400 }
      );
    }

    // Call Python backend
    const response = await fetch(`${BACKEND_URL}/api/audit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: body.business_name,
        city: body.city,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Backend response:', JSON.stringify(data, null, 2)); // Debug log
    
    // Transform Python response to match frontend expectations  
    if (data.status === "success" || data.status === "partial_success") {
      // Check if fields is an empty object {} and convert to null
      const fields = data.unified_results?.fields;
      const hasValidFields = fields && 
                            typeof fields === 'object' && 
                            Object.keys(fields).length > 0 && 
                            fields.address;
      
      const transformed = {
        status: data.status,
        data: {
          businessName: body.business_name,
          city: body.city,
          score: data.unified_results?.score || 0,
          summary: data.unified_results?.summary || 'No summary available',
          fields: hasValidFields ? fields : null,
          schemaJson: data.unified_results?.schema_json || '{}',
          missingInfoSuggestions: data.unified_results?.missing_info_suggestions || []
        },
        errors: data.errors || [],
        warnings: data.warnings || []
      };
      console.log('Transformed response:', JSON.stringify(transformed, null, 2)); // Debug log
      return NextResponse.json(transformed);
    }
    
    // Return error if backend didn't succeed
    console.error('Backend failed:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error calling backend:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Failed to connect to backend. Make sure the Python server is running on http://localhost:8000" 
      },
      { status: 500 }
    );
  }
}
