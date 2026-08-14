import { Module } from '@nestjs/common';
import { PedagogicalService } from './pedagogical.service';

@Module({
  providers: [PedagogicalService],
  exports: [PedagogicalService],
})
export class PedagogicalModule {}