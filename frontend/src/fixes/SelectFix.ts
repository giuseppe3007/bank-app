import { SelectChangeEvent } from '@mui/material/Select';

// Utility per convertire il tipo di evento ChangeEvent in SelectChangeEvent
export const createSelectChangeHandler = (
  handler: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void
) => {
  return (event: SelectChangeEvent<string>, child: React.ReactNode) => {
    // Convertiamo l'evento in un formato compatibile
    const adaptedEvent = {
      target: {
        name: event.target.name,
        value: event.target.value
      }
    } as React.ChangeEvent<{ name?: string; value: unknown }>;
    
    handler(adaptedEvent);
  };
};
