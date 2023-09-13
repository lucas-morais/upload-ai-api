import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { openai } from '../lib/openai';
import { prisma } from '../lib/prisma';



export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (request, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      template: z.string(),
      temapratura: z.number().min(0).max(1).default(0.5),
    })

    const { videoId, template, temapratura } = bodySchema.parse(request.body);


    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      }
    });

    if(!video.transcricao) {

      return reply.status(400).send('Video trancription has not been generated')
    }

    const promptMessage = template.replace('transcription', video.transcricao);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature: temapratura,
      messages: [
        {role: 'user', content: promptMessage}
      ]
    });
    return response;
  });
}