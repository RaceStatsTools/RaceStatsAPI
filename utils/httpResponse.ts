export class HttpResponse {

    constructor(public status: number, public data?: any, public total?: number) {
        if (status === 500 && !data) {
            this.data = { reason : 'INTERNAL_ERROR' };
        }
    }

    formatWithTotal(){
      return {
        data: this.data,
        total: this.total
      }
    }
}