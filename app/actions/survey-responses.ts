"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveSurveyResponse(data: {
  survey_id: string
  user_id?: string
  guest_identifier?: string
  responses: any
  user_info?: {
    name?: string
    email?: string
    phone?: string
  }
}) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("survey_responses").insert({
      survey_id: data.survey_id,
      user_id: data.user_id || null,
      responses: {
        answers: data.responses,
        user_info: data.user_info,
        guest_identifier: data.guest_identifier,
        submitted_at: new Date().toISOString(),
      },
      submitted_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error saving survey response:", error)
      return { success: false, error: error.message }
    }

    // Update survey responses count
    await supabase.rpc("increment_survey_responses", { survey_id: data.survey_id })

    return { success: true }
  } catch (error) {
    console.error("[v0] Error saving survey response:", error)
    return { success: false, error: "Failed to save survey response" }
  }
}

export async function getSurveyResponses(surveyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .order("submitted_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching survey responses:", error)
    return []
  }

  return data
}
