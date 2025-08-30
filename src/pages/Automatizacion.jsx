import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import { sendDailyAccountStatements } from '@/api/functions';

export default function Automatizacion() {
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [statementsResult, setStatementsResult] = useState(null);

  const handleSendStatements = async () => {
    setIsLoadingStatements(true);
    setStatementsResult(null);
    try {
      const response = await sendDailyAccountStatements();
      if (response.data && response.data.success) {
        setStatementsResult({ success: true, message: response.data.message });
      } else {
        throw new Error(response.data?.error || "Error desconocido");
      }
    } catch (error) {
      setStatementsResult({ success: false, message: `Error: ${error.message}` });
    }
    setIsLoadingStatements(false);
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Tareas Diarias
          </h1>
          <p className="text-slate-600 font-medium">
            Ejecuta las tareas programadas del sistema. Se recomienda hacerlo una vez al día.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg border-0 md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Enviar Estados de Cuenta por WhatsApp</CardTitle>
                  <CardDescription>Envía un resumen de saldos pendientes a cada cliente con un grupo de WhatsApp configurado.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSendStatements} 
                disabled={isLoadingStatements}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoadingStatements ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Ejecutar Envío Masivo</>
                )}
              </Button>
              {statementsResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${statementsResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                  {statementsResult.message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}