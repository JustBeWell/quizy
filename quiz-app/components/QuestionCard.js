export default function QuestionCard({q, selected, onSelect}){
  return (
    <div className="qcard">
      <h3 dangerouslySetInnerHTML={{__html:q.question}} />
      <ul>
        {(q.options && q.options.length>0)? q.options.map(o=> (
          <li key={o.key} className={selected===o.key? 'sel':''} onClick={()=>onSelect(o.key)}>
            <strong>{o.key}.</strong>
            <span dangerouslySetInnerHTML={{__html:o.text}} />
          </li>
        )): <li className={selected==='text'? 'sel':''} onClick={()=>onSelect('text')}>Respuesta libre (marcar)</li>}
      </ul>
      <style jsx>{`
        .qcard{padding:16px}
        ul{list-style:none;padding:0}
        li{padding:10px;border-radius:8px;border:1px solid #eee;margin-bottom:8px;cursor:pointer}
        .sel{background:#e8f0ff;border-color:#cfe0ff}
      `}</style>
    </div>
  )
}
