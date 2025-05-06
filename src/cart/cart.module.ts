import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule], // 👈 ต้องมี AuthModule
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
