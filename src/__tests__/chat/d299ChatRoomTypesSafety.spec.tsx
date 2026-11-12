import fs from 'fs'
import path from 'path'

describe('D-299: Chat Types Safety and Any Sweep Characterization', () => {
  it('strictly enforces 0 occurrences of : any, as any, or <any> in app/chat/[id].tsx', () => {
    const filePath = path.resolve(__dirname, '../../../app/chat/[id].tsx')
    const source = fs.readFileSync(filePath, 'utf8')
    const matches = source.match(/:\s*any\b|\bas any\b|<any>/g) || []
    expect(matches).toEqual([])
  })

  it('strictly enforces 0 occurrences of : any, as any, or <any> in src/hooks/useChatRoomLogic.ts', () => {
    const filePath = path.resolve(__dirname, '../../hooks/useChatRoomLogic.ts')
    const source = fs.readFileSync(filePath, 'utf8')
    const matches = source.match(/:\s*any\b|\bas any\b|<any>/g) || []
    expect(matches).toEqual([])
  })
})
