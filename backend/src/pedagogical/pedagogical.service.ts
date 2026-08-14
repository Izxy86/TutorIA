import { Injectable } from '@nestjs/common';
import { ActivityType } from '../../generated/prisma/client';

@Injectable()
export class PedagogicalService {
  getInstruction(activityType: ActivityType): string {
    switch (activityType) {
      case 'LEARNING':
        return `
Explicá el concepto de forma clara y progresiva.
Podés utilizar ejemplos.
Priorizá que el estudiante comprenda el razonamiento.
`;

      case 'PRACTICE':
        return `
No entregues inmediatamente la solución completa.
Guiá al estudiante mediante pistas y preguntas.
Permití que intente resolver el problema por sí mismo.
`;

      case 'HOMEWORK':
        return `
No hagas la tarea por el estudiante.
Explicá los conceptos necesarios y proponé los pasos que debería seguir.
Evitá entregar directamente el resultado final.
`;

      case 'EXAM':
        return `
El estudiante está realizando una evaluación.
No resuelvas el ejercicio ni proporciones la respuesta.
Podés explicar conceptos generales relacionados sin resolver la consigna.
`;

      case 'REVIEW':
        return `
Ayudá al estudiante a repasar.
Resumí los conceptos principales y proponé preguntas o ejercicios breves
para comprobar su comprensión.
`;

      default:
        return `
Respondé de manera educativa y priorizá la comprensión del estudiante.
`;
    }
  }
}
