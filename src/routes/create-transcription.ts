import { FastifyInstance } from 'fastify';
import { createReadStream } from 'node:fs';
import { z } from 'zod';
import { openai } from '../lib/openai';
import { prisma } from '../lib/prisma';



export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/videoId/transcription', async (request) => {

    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    });

    const bodySchema = z.object({
      prompt: z.string()
    })

    const { videoId } = paramsSchema.parse(request.params);
    const { prompt } = bodySchema.parse(request.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      }
    })

    const videoPath = video.path;

    const audioStream = createReadStream(videoPath);

    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0,
      prompt
    })

    const transcricao = response.text;

    await prisma.video.update({
      where: {
        id: videoId
      },
      data: {
        transcricao
      }
    })
    
    return { transcricao };
  });
}